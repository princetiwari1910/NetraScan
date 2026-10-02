import onnx
from onnx import numpy_helper
import numpy as np

model = onnx.load("ml-training/models/NetraScan_ResNet18.onnx")
graph = model.graph
initializers = {init.name: numpy_helper.to_array(init) for init in graph.initializer}

print("=== GRAPH OUTPUTS ===")
for out in graph.output:
    shape = [d.dim_value if d.dim_value > 0 else (d.dim_param or "dynamic") for d in out.type.tensor_type.shape.dim]
    print(f"Output: '{out.name}' -> shape {shape}, type {onnx.TensorProto.DataType.Name(out.type.tensor_type.elem_type)}")

# Let's compute FLOPs / MACs layer by layer for input shape (1, 3, 224, 224)
H, W = 224, 224
C = 3
total_macs = 0

print("\n=== FLOPs / MACs Calculation ===")
shapes = {'data': (1, 3, 224, 224)}

for i, node in enumerate(graph.node):
    op = node.op_type
    inp_name = node.input[0]
    out_name = node.output[0]
    
    if op == 'Sub' or op == 'Div' or op == 'Relu':
        shapes[out_name] = shapes[inp_name]
    elif op == 'MaxPool':
        # kernel 3x3, stride 2, pad 1
        in_shape = shapes[inp_name]
        out_h = (in_shape[2] + 2*1 - 3)//2 + 1
        out_w = (in_shape[3] + 2*1 - 3)//2 + 1
        shapes[out_name] = (in_shape[0], in_shape[1], out_h, out_w)
    elif op == 'Conv':
        in_shape = shapes[inp_name]
        w = initializers[node.input[1]]
        out_c, in_c, kh, kw = w.shape
        # get stride and pad
        strides = [1, 1]
        pads = [0, 0, 0, 0]
        for attr in node.attribute:
            if attr.name == 'strides':
                strides = attr.ints
            elif attr.name == 'pads':
                pads = attr.ints
        out_h = (in_shape[2] + pads[0] + pads[2] - kh) // strides[0] + 1
        out_w = (in_shape[3] + pads[1] + pads[3] - kw) // strides[1] + 1
        shapes[out_name] = (in_shape[0], out_c, out_h, out_w)
        # MACs = out_c * out_h * out_w * (in_c * kh * kw)
        macs = out_c * out_h * out_w * in_c * kh * kw
        total_macs += macs
        print(f"[{i:02d}] Conv {node.name:20s}: in {in_shape} -> out {shapes[out_name]}, kernel ({kh}x{kw}), MACs={macs:,}")
    elif op == 'BatchNormalization':
        shapes[out_name] = shapes[inp_name]
    elif op == 'Sum':
        shapes[out_name] = shapes[inp_name]
    elif op == 'GlobalAveragePool':
        in_shape = shapes[inp_name]
        shapes[out_name] = (in_shape[0], in_shape[1], 1, 1)
        print(f"[{i:02d}] GlobalAveragePool {node.name}: in {in_shape} -> out {shapes[out_name]}")
    elif op == 'Flatten':
        in_shape = shapes[inp_name]
        shapes[out_name] = (in_shape[0], in_shape[1])
        print(f"[{i:02d}] Flatten {node.name}: in {in_shape} -> out {shapes[out_name]}")
    elif op == 'Softmax':
        shapes[out_name] = shapes[inp_name]
        print(f"[{i:02d}] Softmax {node.name}: in {shapes[inp_name]} -> out {shapes[out_name]}")

print(f"\nTotal Convolutional MACs: {total_macs:,} ({total_macs / 1e9:.3f} GMACs)")
print(f"Approximate FLOPs (2 * MACs): {2 * total_macs:,} ({2 * total_macs / 1e9:.3f} GFLOPs)")

print("\n=== RESIDUAL BLOCKS VERIFICATION ===")
stages = {
    "res2 (Stage 1)": ["res2a", "res2b"],
    "res3 (Stage 2)": ["res3a", "res3b"],
    "res4 (Stage 3)": ["res4a", "res4b"],
    "res5 (Stage 4)": ["res5a", "res5b"]
}
for stage_name, blocks in stages.items():
    print(f"\nStage: {stage_name}")
    for b in blocks:
        convs = [n for n in graph.node if n.op_type == 'Conv' and b in n.name]
        print(f"  Block {b}: {len(convs)} Convs: {[c.name for c in convs]}")
        for c in convs:
            w = initializers[c.input[1]]
            print(f"    - {c.name}: weight shape {w.shape}")

print("\n=== RES5B_RELU LAYER VERIFICATION ===")
res5b_relu_nodes = [n for n in graph.node if 'res5b_relu' in n.output or 'res5b_relu' in n.name]
for n in res5b_relu_nodes:
    print(f"Node: {n.name}, Op: {n.op_type}, Inputs: {n.input}, Outputs: {n.output}")
print(f"Shape of 'res5b_relu': {shapes.get('res5b_relu', 'Unknown')}")

