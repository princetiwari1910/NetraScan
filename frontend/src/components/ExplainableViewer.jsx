import { useState } from "react";
import {
  Eye,
  Brain,
  ScanSearch,
  Activity,
  CircleCheck,
  MapPin,
} from "lucide-react";

function ExplainableViewer() {
  const [view, setView] = useState("ai");

  return (
    <section className="xai-section">

      {/* HEADER */}
      <div className="xai-header">
        <div>
          <span className="xai-label">EXPLAINABLE AI</span>

          <h2>See why the AI made this assessment</h2>

          <p>
            NetraScan highlights retinal regions that influenced the
            screening assessment, making the AI analysis easier to understand.
          </p>
        </div>

        <div className="xai-header-icon">
          <Brain size={23} />
        </div>
      </div>


      {/* VIEWER */}
      <div className="xai-viewer-card">

        <div className="xai-viewer-top">

          <div>
            <span className="viewer-label">RETINAL VISUALIZATION</span>

            <h3>
              AI attention map
            </h3>
          </div>

          <div className="viewer-toggle">

            <button
              className={view === "original" ? "active" : ""}
              onClick={() => setView("original")}
            >
              <Eye size={15} />
              Original
            </button>

            <button
              className={view === "ai" ? "active" : ""}
              onClick={() => setView("ai")}
            >
              <Brain size={15} />
              AI Analysis
            </button>

          </div>

        </div>


        {/* IMAGE */}
        <div className={`xai-image ${view === "ai" ? "ai-view" : "original-view"}`}>

          <div className="xai-retina">

            <div className="xai-retina-core"></div>

            <div className="xai-vessel xai-vessel-1"></div>
            <div className="xai-vessel xai-vessel-2"></div>
            <div className="xai-vessel xai-vessel-3"></div>
            <div className="xai-vessel xai-vessel-4"></div>
            <div className="xai-vessel xai-vessel-5"></div>
            <div className="xai-vessel xai-vessel-6"></div>

            {/* AI HEATMAP */}
            {view === "ai" && (
              <>
                <div className="heat-zone heat-zone-1"></div>
                <div className="heat-zone heat-zone-2"></div>
                <div className="heat-zone heat-zone-3"></div>

                <div className="lesion-marker marker-1">
                  <MapPin size={13} />
                </div>

                <div className="lesion-marker marker-2">
                  <MapPin size={13} />
                </div>

                <div className="lesion-marker marker-3">
                  <MapPin size={13} />
                </div>
              </>
            )}

          </div>


          {view === "ai" && (
            <div className="attention-legend">

              <span>
                <i className="legend-low"></i>
                Low attention
              </span>

              <span>
                <i className="legend-medium"></i>
                Moderate
              </span>

              <span>
                <i className="legend-high"></i>
                High attention
              </span>

            </div>
          )}

        </div>


        {/* DETECTION SUMMARY */}
        <div className="xai-detection-grid">

          <div className="xai-detection-card">

            <div className="detection-icon">
              <ScanSearch size={19} />
            </div>

            <div>
              <span>IMAGE QUALITY</span>
              <strong>Good</strong>
            </div>

            <CircleCheck size={18} className="detection-check" />

          </div>


          <div className="xai-detection-card">

            <div className="detection-icon">
              <Eye size={19} />
            </div>

            <div>
              <span>RETINAL STRUCTURES</span>
              <strong>Clearly visible</strong>
            </div>

            <CircleCheck size={18} className="detection-check" />

          </div>


          <div className="xai-detection-card">

            <div className="detection-icon">
              <Activity size={19} />
            </div>

            <div>
              <span>LESION ATTENTION</span>
              <strong>Low</strong>
            </div>

            <CircleCheck size={18} className="detection-check" />

          </div>

        </div>

      </div>


      {/* WHY AI MADE THIS RESULT */}
      <div className="xai-explanation">

        <div className="xai-explanation-icon">
          <Brain size={20} />
        </div>

        <div>

          <span className="xai-label">AI REASONING SUMMARY</span>

          <h3>
            Why was this classified as No DR?
          </h3>

          <p>
            The screening pipeline found suitable image quality,
            identifiable retinal structures and no significant
            suspicious lesion patterns in this demonstration.
          </p>

        </div>

      </div>

    </section>
  );
}

export default ExplainableViewer;