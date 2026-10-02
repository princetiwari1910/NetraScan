import os
import hashlib
import json
import numpy as np
import onnx
from onnx import numpy_helper

model_path = "ml-training/models/NetraScan_ResNet18.onnx"
file_size = os.path.getsize(model_path)
with open(model_path, "rb") as f:
    sha256 = hashlib.sha256(f.read()).hexdigest()

model = onnx.load(model_path)
graph = model.graph

initializers = {init.name: numpy_helper.to_array(init) for init in graph.initializer}

print(f"=== BASIC INFO ===")
print(f"File size: {file_size} bytes")
print(f"SHA-256: {sha256}")
print(f"IR Version: {model.ir_version}")
print(f"Opset: {[f'{op.domain}:{op.version}' for op in model.opset_import]}")
print(f"Producer: name='{model.producer_name}', version='{model.producer_version}'")
print(f"Domain: '{model.domain}', Model version: {model.model_version}")
print(f"Doc string: '{model.doc_string}'")
print(f"Graph name: '{graph.name}'")
print(f"Metadata props: {[(p.key, p.value) for p in model.metadata_props]}")

print("\n=== INPUTS & PREPROCESSING ===")
for inp in graph.input:
    if inp.name not in initializers:
        shape = [d.dim_value if d.dim_value > 0 else (d.dim_param or "dynamic") for d in inp.type.tensor_type.shape.dim]
        elem_type = onnx.TensorProto.DataType.Name(inp.type.tensor_type.elem_type)
        print(f"Model Input: name='{inp.name}', type={elem_type}, shape={shape}")

# Trace the first 10 nodes from input
for i in range(min(12, len(graph.node))):
    node = graph.node[i]
    attrs = {attr.name: onnx.helper.get_attribute_value(attr) for attr in node.attribute}
    print(f"Node {i:02d}: op={node.op_type:18s} name='{node.name:25s}' inputs={node.input} outputs={node.output} attrs={attrs}")

print("\n=== OUTPUTS ===")
for out in graph.output:
    shape = [d.dim_value if d.dim_value > 0 else (d.dim_param or "dynamic") for d in out.type.tensor_type.shape.dim]
    elem_type = onnx.TensorProto.DataType.Name(out.type.tensor_type.elem_type)
    print(f"Model Output: name='{out.name}', type={elem_type}, shape={shape}")

print("\n=== ALL GRAPH NODES (Full List) ===")
for i, node in enumerate(graph.node):
    attrs = {attr.name: onnx.helper.get_attribute_value(attr) for attr in node.attribute}
    in_tensors = []
    for inp in node.input:
        if inp in initializers:
            in_tensors.append(f"{inp}{list(initializers[inp].shape)}")
        else:
            in_tensors.append(inp)
    print(f"[{i:02d}] {node.op_type:18s} | {node.name:25s} | in: {in_tensors} -> out: {node.output} | attrs: {attrs}")

print("\n=== CLASSIFICATION HEAD DETAILS ===")
fc_weights = [k for k in initializers.keys() if "fc" in k.lower() or "prob" in k.lower() or "classifier" in k.lower() or "dense" in k.lower()]
print(f"FC/Classifier weight tensors: {fc_weights}")
for k in fc_weights:
    arr = initializers[k]
    print(f"  {k}: shape={arr.shape}, dtype={arr.dtype}, size={arr.size}")

print("\n=== PARAMETER BREAKDOWN ===")
total_params = 0
learnable_params = 0
non_learnable_params = 0

stage_breakdown = {}
for name, arr in initializers.items():
    total_params += arr.size
    is_bn_stat = "mean" in name or "var" in name
    if is_bn_stat:
        non_learnable_params += arr.size
    else:
        learnable_params += arr.size
    
    # Identify stage
    prefix = name.split("_")[0]
    stage_breakdown[prefix] = stage_breakdown.get(prefix, 0) + arr.size

print(f"Total Stored Parameters: {total_params:,}")
print(f"Learnable Parameters (Weights + Biases + BN scale/B): {learnable_params:,}")
print(f"Non-learnable Parameters (BN Running Mean/Var): {non_learnable_params:,}")
print("Parameters by tensor prefix:")
for k, v in sorted(stage_breakdown.items(), key=lambda x: -x[1]):
    print(f"  {k:20s}: {v:,}")

print("\n=== SEARCHING STRINGS / CLASS NAMES IN TENSORS & ATTRIBUTES ===")
found_strings = []
for node in graph.node:
    for s in [node.name, node.doc_string] + list(node.input) + list(node.output):
        if any(w in s.lower() for w in ["grade", "dr", "mild", "mod", "sev", "pdr", "npdr", "class", "diabet"]):
            found_strings.append(f"Node string: {s}")

print(f"Found class/DR strings in graph structure: {found_strings}")

