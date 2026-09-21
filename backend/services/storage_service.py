import os
import json
import base64
import urllib.request
import urllib.error
import logging
from typing import Optional, Tuple
from core.config import settings

logger = logging.getLogger("netrascan.storage")


class StorageService:
    """
    Production-grade StorageService abstraction for NetraScan.
    Interacts with private Supabase Storage buckets via authenticated REST API.
    Generates time-limited signed URLs for client rendering while keeping buckets strictly private.
    Maintains full backward compatibility with legacy base64 data URIs and local file paths.
    """

    def __init__(self):
        self.supabase_url = (getattr(settings, "SUPABASE_URL", "") or os.getenv("SUPABASE_URL", "")).rstrip("/")
        self.secret_key = getattr(settings, "SUPABASE_SECRET_KEY", "") or os.getenv("SUPABASE_SECRET_KEY", "")
        self.bucket_originals = "fundus-originals"
        self.bucket_gradcam = "fundus-gradcam"
        self.default_expires_in = 3600  # 1 hour


    @property
    def is_connected(self) -> bool:
        """Returns True if Supabase URL and Secret Key are configured."""
        return bool(self.supabase_url and self.secret_key)

    def parse_storage_reference(self, reference: str) -> Optional[Tuple[str, str]]:
        """
        Parses a storage reference string into (bucket, object_path).
        Supported formats:
          - 'fundus-originals/screening/1/original.jpg' -> ('fundus-originals', 'screening/1/original.jpg')
          - 'fundus-gradcam/screening/1/gradcam.jpg' -> ('fundus-gradcam', 'screening/1/gradcam.jpg')
          - 'screening/1/original.jpg' -> ('fundus-originals', 'screening/1/original.jpg')
          - 'screening/1/gradcam.jpg' -> ('fundus-gradcam', 'screening/1/gradcam.jpg')
        """
        if not reference or reference.startswith("data:") or reference.startswith("http://") or reference.startswith("https://"):
            return None

        if reference.startswith(f"{self.bucket_originals}/"):
            return self.bucket_originals, reference[len(self.bucket_originals) + 1:]
        elif reference.startswith(f"{self.bucket_gradcam}/"):
            return self.bucket_gradcam, reference[len(self.bucket_gradcam) + 1:]
        elif reference.startswith("screening/"):
            if "gradcam" in reference:
                return self.bucket_gradcam, reference
            else:
                return self.bucket_originals, reference

        return None

    def is_storage_path(self, reference: Optional[str]) -> bool:
        """Returns True if reference represents a Supabase Storage path."""
        return self.parse_storage_reference(reference or "") is not None

    def get_signed_url(self, bucket: str, object_path: str, expires_in: Optional[int] = None) -> Optional[str]:
        """
        Generates a short-lived signed URL for a private Supabase Storage object.
        Does NOT expose secret keys or internal credentials.
        """
        if not self.is_connected:
            logger.warning("StorageService: cannot generate signed URL (Supabase credentials not configured).")
            return None

        exp = expires_in or self.default_expires_in
        sign_endpoint = f"{self.supabase_url}/storage/v1/object/sign/{bucket}/{object_path}"
        payload = json.dumps({"expiresIn": exp}).encode("utf-8")

        headers = {
            "apikey": self.secret_key,
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }

        req = urllib.request.Request(sign_endpoint, data=payload, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=10.0) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    signed_path = data.get("signedURL") or data.get("signedUrl")
                    if signed_path:
                        if signed_path.startswith("http://") or signed_path.startswith("https://"):
                            return signed_path
                        return f"{self.supabase_url}/storage/v1{signed_path}"
        except urllib.error.HTTPError as e:
            logger.warning(f"StorageService signed URL error ({bucket}/{object_path}): HTTP {e.code}")
            return None
        except Exception as e:
            logger.warning(f"StorageService signed URL error ({bucket}/{object_path}): {e}")
            return None

        return None

    def resolve_image_url(self, reference: Optional[str], expires_in: Optional[int] = None) -> Optional[str]:
        """
        Dual-mode resolver:
        1. If reference is a legacy Base64 data URI -> returns it directly for backward compatibility.
        2. If reference is already an HTTP(S) URL -> returns it directly.
        3. If reference is a Supabase Storage object path -> generates and returns a signed URL.
        4. If reference is empty/None -> returns None.
        """
        if not reference:
            return None

        # 1. Legacy base64 support
        if reference.startswith("data:image/"):
            return reference

        # 2. Existing full URL
        if reference.startswith("http://") or reference.startswith("https://"):
            return reference

        # 3. Supabase Storage Path
        parsed = self.parse_storage_reference(reference)
        if parsed:
            bucket, obj_path = parsed
            signed_url = self.get_signed_url(bucket, obj_path, expires_in)
            if signed_url:
                return signed_url

        # Fallback to returning the reference string as-is
        return reference

    def upload_binary(self, bucket: str, object_path: str, data: bytes, content_type: str = "image/jpeg") -> bool:
        """
        Uploads binary bytes to a private Supabase Storage bucket.
        """
        if not self.is_connected:
            logger.warning("StorageService: upload failed (Supabase credentials not configured).")
            return False

        upload_url = f"{self.supabase_url}/storage/v1/object/{bucket}/{object_path}"
        headers = {
            "apikey": self.secret_key,
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": content_type,
            "x-upsert": "true",
        }

        req = urllib.request.Request(upload_url, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=30.0) as resp:
                return resp.status in (200, 201)
        except Exception as e:
            logger.error(f"StorageService upload error ({bucket}/{object_path}): {e}")
            return False

    def download_binary(self, bucket: str, object_path: str) -> Optional[bytes]:
        """
        Downloads binary bytes from a private Supabase Storage bucket.
        """
        if not self.is_connected:
            return None

        download_url = f"{self.supabase_url}/storage/v1/object/authenticated/{bucket}/{object_path}"
        headers = {
            "apikey": self.secret_key,
            "Authorization": f"Bearer {self.secret_key}",
        }

        req = urllib.request.Request(download_url, headers=headers, method="GET")
        try:
            with urllib.request.urlopen(req, timeout=30.0) as resp:
                if resp.status == 200:
                    return resp.read()
        except Exception as e:
            logger.error(f"StorageService download error ({bucket}/{object_path}): {e}")
            return None

        return None

    def download_by_reference(self, reference: str) -> Optional[Tuple[bytes, str]]:
        """
        Downloads binary bytes given a reference path.
        Returns (bytes, mime_type) or None.
        """
        parsed = self.parse_storage_reference(reference)
        if not parsed:
            return None

        bucket, obj_path = parsed
        content = self.download_binary(bucket, obj_path)
        if content is None:
            return None

        ext = obj_path.split(".")[-1].lower()
        mime = "image/jpeg"
        if ext == "png":
            mime = "image/png"
        elif ext == "webp":
            mime = "image/webp"

        return content, mime


# Singleton instance
storage_service = StorageService()
