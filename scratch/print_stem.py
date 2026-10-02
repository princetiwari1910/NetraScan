import onnx
from onnx import numpy_helper

model = onnx.load("ml-training/models/NetraScan_ResNet18.onnx")
graph = model.graph
initializers = {init.name: numpy_helper.to_array(init) for init in graph.initializer}

print("=== NODES 0 TO 20 ===")
for i in range(21):
    node = graph.node[i]
    attrs = {attr.name: onnx.helper.get_attribute_value(attr) for attr in node.attribute}
    in_tensors = []
    for inp in node.input:
        if inp in initializers:
            in_tensors.append(f"{inp}{list(initializers[inp].shape)}")
        else:
            in_tensors.append(inp)
    print(f"[{i:02d}] {node.op_type:18s} | {node.name:25s} | in: {in_tensors} -> out: {node.output} | attrs: {attrs}")

print("\n=== PREPROCESSING CONSTANTS ===")
for name in ["data_Mean", "data_StandardDeviation", "data_Scale", "data_Sub"]:
    for init_name, arr in initializers.items():
        if name.lower() in init_name.lower():
            print(f"Initializer '{init_name}': shape={arr.shape}, dtype={arr.dtype}, values={arr.tolist()}")

