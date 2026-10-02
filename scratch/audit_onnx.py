import os
import sys
import hashlib
import json
import numpy as np
import onnx
from onnx import numpy_helper

model_path = "ml-training/models/NetraScan_ResNet18.onnx"
print(f"Loading ONNX model from: {model_path}")

file_size = os.path.getsize(model_path)
with open(model_path, "rb") as f:
    sha256 = hashlib.sha256(f.read()).hexdigest()

model = onnx.load(model_path)
graph = model.graph

print("=== 1. MODEL IDENTITY ===")
print(f"File: {model_path}")
print(f"File size: {file_size} bytes ({file_size / (1024*1024):.2f} MB)")
print(f"SHA-256: {sha256}")
print(f"IR Version: {model.ir_version}")
print(f"Producer Name: '{model.producer_name}'")
print(f"Producer Version: '{model.producer_version}'")
print(f"Domain: '{model.domain}'")
print(f"Model Version: {model.model_version}")
print(f"Doc String: '{model.doc_string}'")
print(f"Graph Name: '{graph.name}'")
print(f"Graph Doc String: '{graph.doc_string}'")
print("Opset Imports:")
for op in model.opset_import:
    print(f"  Domain: '{op.domain}', Version: {op.version}")
print("Metadata Properties:")
for prop in model.metadata_props:
    print(f"  {prop.key}: {prop.value}")

print("\n=== 2. GRAPH INPUTS ===")
initializers = {init.name: numpy_helper.to_array(init) for init in graph.initializer}
print(f"Total Initializers: {len(initializers)}")

for inp in graph.input:
    shape = [d.dim_value if d.dim_value > 0 else (d.dim_param or "dynamic") for d in inp.type.tensor_type.shape.dim]
    elem_type = onnx.TensorProto.DataType.Name(inp.type.tensor_type.elem_type)
    is_init = inp.name in initializers
    print(f"Input: name='{inp.name}', type={elem_type}, shape={shape}, is_initializer={is_init}")

print("\n=== 3. GRAPH OUTPUTS ===")
for out in graph.output:
    shape = [d.dim_value if d.dim_value > 0 else (d.dim_param or "dynamic") for d in out.type.tensor_type.shape.dim]
    elem_type = onnx.TensorProto.DataType.Name(out.type.tensor_type.elem_type)
    print(f"Output: name='{out.name}', type={elem_type}, shape={shape}")

print("\n=== 4. NODES INVENTORY & SEQUENCE ===")
print(f"Total Nodes: {len(graph.node)}")
op_types = {}
for i, node in enumerate(graph.node):
    op_types[node.op_type] = op_types.get(node.op_type, 0) + 1
    if i < 10 or i > len(graph.node) - 10:
        print(f"  Node {i:3d}: op={node.op_type:15s} name='{node.name}' inputs={node.input} outputs={node.output}")
print("\nOp Type Frequency:")
for op, count in sorted(op_types.items(), key=lambda x: -x[1]):
    print(f"  {op:20s}: {count}")

print("\n=== 5. PREPROCESSING NODES ANALYSIS ===")
# Trace nodes attached to input 'data'
input_names = [inp.name for inp in graph.input if inp.name not in initializers]
print(f"Main input name(s): {input_names}")
for node in graph.node:
    for inp_name in input_names:
        if inp_name in node.input:
            print(f"Node consuming '{inp_name}': op={node.op_type}, name='{node.name}', inputs={node.input}, outputs={node.output}")
            for inp_t in node.input:
                if inp_t in initializers:
                    arr = initializers[inp_t]
                    print(f"  Constant input '{inp_t}': shape={arr.shape}, dtype={arr.dtype}, min={arr.min()}, max={arr.max()}, values={arr.flatten()[:10]}")

print("\n=== 6. COMPLETE LAYER-BY-LAYER TRACE ===")
total_params = 0
stage_params = {"stem": 0, "res2": 0, "res3": 0, "res4": 0, "res5": 0, "fc": 0, "bn": 0, "other": 0}

for init_name, arr in initializers.items():
    total_params += arr.size
    lname = init_name.lower()
    if "conv1" in lname or "data" in lname:
        stage_params["stem"] += arr.size
    elif "res2" in lname or "layer1" in lname:
        stage_params["res2"] += arr.size
    elif "res3" in lname or "layer2" in lname:
        stage_params["res3"] += arr.size
    elif "res4" in lname or "layer3" in lname:
        stage_params["res4"] += arr.size
    elif "res5" in lname or "layer4" in lname:
        stage_params["res5"] += arr.size
    elif "fc" in lname or "prob" in lname or "classifier" in lname:
        stage_params["fc"] += arr.size
    else:
        stage_params["other"] += arr.size

print(f"Total Stored Parameters: {total_params:,} ({total_params * 4 / (1024*1024):.2f} MB float32)")
print("Parameters by approximate stage naming:")
for k, v in stage_params.items():
    print(f"  {k:10s}: {v:,} ({v/total_params*100:.1f}%)")

print("\nDetailed Node-by-Node Architecture:")
for i, node in enumerate(graph.node):
    attrs = {attr.name: onnx.helper.get_attribute_value(attr) for attr in node.attribute}
    inp_shapes = [initializers[n].shape if n in initializers else "?" for n in node.input]
    print(f"[{i:02d}] {node.op_type:12s} | Name: {node.name:25s} | In: {node.input} | Out: {node.output} | Attrs: {attrs}")

