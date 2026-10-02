"""
Generator for ResouceAllocation.slx Simulink Model
Builds structurally valid OPC XML Simulink .slx archive with:
- All 10 Parameter/Input blocks (PATIENT DEMAND Step, CAMERA CAPACITY, etc.)
- All 20 Output/Display signals
- Signal logging / Outport blocks
"""

import os
import zipfile

SIMULINK_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def create_content_types_xml():
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/simulink/blockdiagram.xml" ContentType="application/vnd.mathworks.simulink.blockdiagram+xml"/>
  <Override PartName="/simulink/graphicalInterface.xml" ContentType="application/vnd.mathworks.simulink.graphicalInterface+xml"/>
</Types>"""


def create_root_rels():
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.mathworks.com/simulink/2010/relationships/blockdiagram" Target="simulink/blockdiagram.xml"/>
</Relationships>"""


def create_blockdiagram_rels():
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.mathworks.com/simulink/2010/relationships/graphicalInterface" Target="graphicalInterface.xml"/>
</Relationships>"""


def create_graphical_interface_xml():
    return """<?xml version="1.0" encoding="UTF-8"?>
<GraphicalInterface>
  <ModelName>ResouceAllocation</ModelName>
  <Interface>
    <Inports/>
    <Outports>
      <Outport Name="actual annual patients"/>
      <Outport Name="Required Daily Patient Demand"/>
      <Outport Name="SCREENING CAPACITY"/>
      <Outport Name="REQUIRED CAMERA"/>
      <Outport Name="CAMERA USED"/>
      <Outport Name="UNUSED CAMERA"/>
      <Outport Name="CAMERA SHORTAGE"/>
      <Outport Name="CAMERA UTILIZATION PERCENT"/>
      <Outport Name="SCREENING COVERAGE"/>
      <Outport Name="SCREENING SHORTAGE"/>
      <Outport Name="image generated"/>
      <Outport Name="total data generated"/>
      <Outport Name="bandwidth storage"/>
      <Outport Name="data transmitted"/>
      <Outport Name="image transmitted"/>
      <Outport Name="image processed"/>
      <Outport Name="processing backlog"/>
      <Outport Name="REFERRAL CASES"/>
      <Outport Name="cases reviewed"/>
      <Outport Name="review backlog"/>
    </Outports>
  </Interface>
</GraphicalInterface>"""


def create_resource_allocation_blockdiagram_xml():
    return """<?xml version="1.0" encoding="utf-8"?>
<ModelInformation Version="1.0">
  <Model>
    <Name>ResouceAllocation</Name>
    <Description>NetraScan Telemedicine Resource Allocation, Capacity &amp; Bottleneck Simulation Model</Description>
    <System>
      <P Name="Location">[50, 50, 1500, 950]</P>
      <P Name="Open">on</P>
      <P Name="ZoomFactor">100</P>
      <P Name="ReportName">simulink-default.rpt</P>

      <!-- ========================================================
           INPUT & PARAMETER BLOCKS
           ======================================================== -->
      <Block BlockType="Step" Name="PATIENT DEMAND" SID="1">
        <P Name="Position">[60, 80, 120, 120]</P>
        <P Name="Time">10</P>
        <P Name="Before">100</P>
        <P Name="After">300</P>
        <P Name="SampleTime">0</P>
      </Block>

      <Block BlockType="Constant" Name="CAMERA CAPACITY" SID="2">
        <P Name="Position">[60, 160, 120, 190]</P>
        <P Name="Value">40</P>
      </Block>

      <Block BlockType="Constant" Name="NUMBER OF CAMERAS" SID="3">
        <P Name="Position">[60, 220, 120, 250]</P>
        <P Name="Value">2</P>
      </Block>

      <Block BlockType="Constant" Name="Image Acquisition Rate" SID="4">
        <P Name="Position">[60, 320, 120, 350]</P>
        <P Name="Value">1</P>
      </Block>

      <Block BlockType="Constant" Name="image size" SID="5">
        <P Name="Position">[60, 380, 120, 410]</P>
        <P Name="Value">5</P>
      </Block>

      <Block BlockType="Constant" Name="bandwidth capacity" SID="6">
        <P Name="Position">[60, 450, 120, 480]</P>
        <P Name="Value">300</P>
      </Block>

      <Block BlockType="Constant" Name="AI Processing Capacity" SID="7">
        <P Name="Position">[60, 530, 120, 560]</P>
        <P Name="Value">60</P>
      </Block>

      <Block BlockType="Constant" Name="Doctor Review Capacity" SID="8">
        <P Name="Position">[60, 610, 120, 640]</P>
        <P Name="Value">50</P>
      </Block>

      <Block BlockType="Constant" Name="Annual Patient Target" SID="9">
        <P Name="Position">[60, 700, 120, 730]</P>
        <P Name="Value">100000</P>
      </Block>

      <Block BlockType="Constant" Name="working days per year" SID="10">
        <P Name="Position">[60, 760, 120, 790]</P>
        <P Name="Value">365</P>
      </Block>

      <!-- ========================================================
           SCREENING & CAMERA LOGIC
           ======================================================== -->
      <!-- Product: SCREENING CAPACITY = CAMERA CAPACITY * NUMBER OF CAMERAS -->
      <Block BlockType="Product" Name="ScreeningCapacityCalc" SID="11">
        <P Name="Position">[200, 165, 230, 215]</P>
        <P Name="Inputs">2</P>
      </Block>

      <!-- Divide & Math: REQUIRED CAMERA = ceil(PATIENT DEMAND / CAMERA CAPACITY) -->
      <Block BlockType="Divide" Name="RequiredCameraCalc" SID="12">
        <P Name="Position">[200, 95, 230, 145]</P>
        <P Name="Inputs">2</P>
      </Block>
      <Block BlockType="Math" Name="CeilReqCamera" SID="13">
        <P Name="Position">[260, 105, 290, 135]</P>
        <P Name="Operator">ceil</P>
      </Block>

      <!-- Min: CAMERA USED = min(NUMBER OF CAMERAS, REQUIRED CAMERA) -->
      <Block BlockType="MinMax" Name="CameraUsedCalc" SID="14">
        <P Name="Position">[340, 110, 370, 150]</P>
        <P Name="Function">min</P>
        <P Name="Inputs">2</P>
      </Block>

      <!-- Subtract: UNUSED CAMERA = max(0, NUMBER OF CAMERAS - REQUIRED CAMERA) -->
      <Block BlockType="Sum" Name="UnusedCameraDiff" SID="15">
        <P Name="Position">[340, 170, 370, 200]</P>
        <P Name="Inputs">+-</P>
      </Block>
      <Block BlockType="MinMax" Name="UnusedCameraCalc" SID="16">
        <P Name="Position">[400, 175, 430, 205]</P>
        <P Name="Function">max</P>
        <P Name="Inputs">2</P>
      </Block>

      <!-- Subtract: CAMERA SHORTAGE = max(0, REQUIRED CAMERA - NUMBER OF CAMERAS) -->
      <Block BlockType="Sum" Name="CameraShortageDiff" SID="17">
        <P Name="Position">[340, 220, 370, 250]</P>
        <P Name="Inputs">+-</P>
      </Block>
      <Block BlockType="MinMax" Name="CameraShortageCalc" SID="18">
        <P Name="Position">[400, 225, 430, 255]</P>
        <P Name="Function">max</P>
        <P Name="Inputs">2</P>
      </Block>

      <!-- Divide & Gain: CAMERA UTILIZATION PERCENT = (CAMERA USED / NUMBER OF CAMERAS) * 100 -->
      <Block BlockType="Divide" Name="CameraUtilCalc" SID="19">
        <P Name="Position">[420, 115, 450, 155]</P>
        <P Name="Inputs">2</P>
      </Block>
      <Block BlockType="Gain" Name="CameraUtilPercent" SID="20">
        <P Name="Position">[480, 120, 520, 150]</P>
        <P Name="Gain">100</P>
      </Block>

      <!-- Min: SCREENING COVERAGE = min(PATIENT DEMAND, SCREENING CAPACITY) -->
      <Block BlockType="MinMax" Name="ScreeningCoverageCalc" SID="21">
        <P Name="Position">[340, 275, 370, 315]</P>
        <P Name="Function">min</P>
        <P Name="Inputs">2</P>
      </Block>

      <!-- Subtract: SCREENING SHORTAGE = max(0, PATIENT DEMAND - SCREENING CAPACITY) -->
      <Block BlockType="Sum" Name="ScreeningShortageDiff" SID="22">
        <P Name="Position">[340, 335, 370, 365]</P>
        <P Name="Inputs">+-</P>
      </Block>
      <Block BlockType="MinMax" Name="ScreeningShortageCalc" SID="23">
        <P Name="Position">[400, 340, 430, 370]</P>
        <P Name="Function">max</P>
        <P Name="Inputs">2</P>
      </Block>

      <!-- ========================================================
           DATA & PIPELINE LOGIC
           ======================================================== -->
      <!-- Product: image generated = SCREENING COVERAGE * Image Acquisition Rate -->
      <Block BlockType="Product" Name="ImageGeneratedCalc" SID="24">
        <P Name="Position">[480, 285, 510, 325]</P>
        <P Name="Inputs">2</P>
      </Block>

      <!-- Product: total data generated = image generated * image size -->
      <Block BlockType="Product" Name="TotalDataGeneratedCalc" SID="25">
        <P Name="Position">[560, 340, 590, 380]</P>
        <P Name="Inputs">2</P>
      </Block>

      <!-- Min: data transmitted = min(total data generated, bandwidth capacity) -->
      <Block BlockType="MinMax" Name="DataTransmittedCalc" SID="26">
        <P Name="Position">[640, 395, 670, 435]</P>
        <P Name="Function">min</P>
        <P Name="Inputs">2</P>
      </Block>

      <!-- Divide: image transmitted = data transmitted / image size -->
      <Block BlockType="Divide" Name="ImageTransmittedCalc" SID="27">
        <P Name="Position">[720, 405, 750, 445]</P>
        <P Name="Inputs">2</P>
      </Block>

      <!-- Min: image processed = min(image transmitted, AI Processing Capacity) -->
      <Block BlockType="MinMax" Name="ImageProcessedCalc" SID="28">
        <P Name="Position">[800, 470, 830, 510]</P>
        <P Name="Function">min</P>
        <P Name="Inputs">2</P>
      </Block>

      <!-- Subtract: processing backlog = max(0, image transmitted - AI Processing Capacity) -->
      <Block BlockType="Sum" Name="ProcessingBacklogDiff" SID="29">
        <P Name="Position">[800, 525, 830, 555]</P>
        <P Name="Inputs">+-</P>
      </Block>
      <Block BlockType="MinMax" Name="ProcessingBacklogCalc" SID="30">
        <P Name="Position">[860, 530, 890, 560]</P>
        <P Name="Function">max</P>
        <P Name="Inputs">2</P>
      </Block>

      <!-- REFERRAL CASES = image processed (all triage cases entering doctor pool) -->
      <Block BlockType="Gain" Name="ReferralCasesRelay" SID="31">
        <P Name="Position">[880, 475, 910, 505]</P>
        <P Name="Gain">1</P>
      </Block>

      <!-- Min: cases reviewed = min(REFERRAL CASES, Doctor Review Capacity) -->
      <Block BlockType="MinMax" Name="CasesReviewedCalc" SID="32">
        <P Name="Position">[960, 550, 990, 590]</P>
        <P Name="Function">min</P>
        <P Name="Inputs">2</P>
      </Block>

      <!-- Subtract: review backlog = max(0, REFERRAL CASES - Doctor Review Capacity) -->
      <Block BlockType="Sum" Name="ReviewBacklogDiff" SID="33">
        <P Name="Position">[960, 605, 990, 635]</P>
        <P Name="Inputs">+-</P>
      </Block>
      <Block BlockType="MinMax" Name="ReviewBacklogCalc" SID="34">
        <P Name="Position">[1020, 610, 1050, 640]</P>
        <P Name="Function">max</P>
        <P Name="Inputs">2</P>
      </Block>

      <!-- ========================================================
           SCALABILITY & ANNUAL TARGET LOGIC
           ======================================================== -->
      <!-- Divide & Ceil: Required Daily Patient Demand = ceil(Annual Patient Target / working days per year) -->
      <Block BlockType="Divide" Name="ReqDailyDemandCalc" SID="35">
        <P Name="Position">[200, 705, 230, 755]</P>
        <P Name="Inputs">2</P>
      </Block>
      <Block BlockType="Math" Name="CeilDailyDemand" SID="36">
        <P Name="Position">[260, 715, 290, 745]</P>
        <P Name="Operator">ceil</P>
      </Block>

      <!-- Product: actual annual patients = PATIENT DEMAND * working days per year -->
      <Block BlockType="Product" Name="ActualAnnualPatientsCalc" SID="37">
        <P Name="Position">[200, 780, 230, 830]</P>
        <P Name="Inputs">2</P>
      </Block>

      <!-- ========================================================
           CONFIRMED DISPLAY BLOCKS (Front-facing Model Outputs)
           ======================================================== -->
      <Block BlockType="Display" Name="SCREENING CAPACITY" SID="41">
        <P Name="Position">[600, 175, 700, 205]</P>
      </Block>

      <Block BlockType="Display" Name="REQUIRED CAMERA" SID="42">
        <P Name="Position">[600, 95, 700, 125]</P>
      </Block>

      <Block BlockType="Display" Name="CAMERA USED" SID="43">
        <P Name="Position">[600, 135, 700, 165]</P>
      </Block>

      <Block BlockType="Display" Name="UNUSED CAMERA" SID="44">
        <P Name="Position">[600, 215, 700, 245]</P>
      </Block>

      <Block BlockType="Display" Name="CAMERA SHORTAGE" SID="45">
        <P Name="Position">[600, 255, 700, 285]</P>
      </Block>

      <Block BlockType="Display" Name="CAMERA UTILIZATION PERCENT" SID="46">
        <P Name="Position">[600, 295, 700, 325]</P>
      </Block>

      <Block BlockType="Display" Name="SCREENING COVERAGE" SID="47">
        <P Name="Position">[600, 335, 700, 365]</P>
      </Block>

      <Block BlockType="Display" Name="SCREENING SHORTAGE" SID="48">
        <P Name="Position">[600, 375, 700, 405]</P>
      </Block>

      <Block BlockType="Display" Name="image generated" SID="49">
        <P Name="Position">[780, 290, 880, 320]</P>
      </Block>

      <Block BlockType="Display" Name="total data generated" SID="50">
        <P Name="Position">[780, 345, 880, 375]</P>
      </Block>

      <Block BlockType="Display" Name="bandwidth storage" SID="51">
        <P Name="Position">[780, 385, 880, 415]</P>
      </Block>

      <Block BlockType="Display" Name="data transmitted" SID="52">
        <P Name="Position">[780, 425, 880, 455]</P>
      </Block>

      <Block BlockType="Display" Name="image transmitted" SID="53">
        <P Name="Position">[850, 410, 950, 440]</P>
      </Block>

      <Block BlockType="Display" Name="image processed" SID="54">
        <P Name="Position">[960, 475, 1060, 505]</P>
      </Block>

      <Block BlockType="Display" Name="processing backlog" SID="55">
        <P Name="Position">[960, 525, 1060, 555]</P>
      </Block>

      <Block BlockType="Display" Name="REFERRAL CASES" SID="56">
        <P Name="Position">[1080, 480, 1180, 510]</P>
      </Block>

      <Block BlockType="Display" Name="cases reviewed" SID="57">
        <P Name="Position">[1120, 555, 1220, 585]</P>
      </Block>

      <Block BlockType="Display" Name="review backlog" SID="58">
        <P Name="Position">[1120, 615, 1220, 645]</P>
      </Block>

      <Block BlockType="Display" Name="Required Daily Patient Demand" SID="59">
        <P Name="Position">[360, 715, 460, 745]</P>
      </Block>

      <Block BlockType="Display" Name="actual annual patients" SID="60">
        <P Name="Position">[360, 790, 460, 820]</P>
      </Block>

      <!-- ========================================================
           EXPOSED OUTPORTS (Safe Non-invasive Logging Integration)
           ======================================================== -->
      <Block BlockType="Outport" Name="out_patients_annual" SID="71">
        <P Name="Position">[500, 795, 530, 815]</P>
        <P Name="Port">1</P>
      </Block>
      <Block BlockType="Outport" Name="out_daily_demand_req" SID="72">
        <P Name="Position">[500, 720, 530, 740]</P>
        <P Name="Port">2</P>
      </Block>
      <Block BlockType="Outport" Name="out_screening_capacity" SID="73">
        <P Name="Position">[740, 180, 770, 200]</P>
        <P Name="Port">3</P>
      </Block>
      <Block BlockType="Outport" Name="out_camera_required" SID="74">
        <P Name="Position">[740, 100, 770, 120]</P>
        <P Name="Port">4</P>
      </Block>
      <Block BlockType="Outport" Name="out_camera_used" SID="75">
        <P Name="Position">[740, 140, 770, 160]</P>
        <P Name="Port">5</P>
      </Block>
      <Block BlockType="Outport" Name="out_camera_unused" SID="76">
        <P Name="Position">[740, 220, 770, 240]</P>
        <P Name="Port">6</P>
      </Block>
      <Block BlockType="Outport" Name="out_camera_shortage" SID="77">
        <P Name="Position">[740, 260, 770, 280]</P>
        <P Name="Port">7</P>
      </Block>
      <Block BlockType="Outport" Name="out_camera_util_pct" SID="78">
        <P Name="Position">[740, 300, 770, 320]</P>
        <P Name="Port">8</P>
      </Block>
      <Block BlockType="Outport" Name="out_screening_coverage" SID="79">
        <P Name="Position">[740, 340, 770, 360]</P>
        <P Name="Port">9</P>
      </Block>
      <Block BlockType="Outport" Name="out_screening_shortage" SID="80">
        <P Name="Position">[740, 380, 770, 400]</P>
        <P Name="Port">10</P>
      </Block>
      <Block BlockType="Outport" Name="out_image_generated" SID="81">
        <P Name="Position">[920, 295, 950, 315]</P>
        <P Name="Port">11</P>
      </Block>
      <Block BlockType="Outport" Name="out_data_generated" SID="82">
        <P Name="Position">[920, 350, 950, 370]</P>
        <P Name="Port">12</P>
      </Block>
      <Block BlockType="Outport" Name="out_bandwidth_storage" SID="83">
        <P Name="Position">[920, 390, 950, 410]</P>
        <P Name="Port">13</P>
      </Block>
      <Block BlockType="Outport" Name="out_data_transmitted" SID="84">
        <P Name="Position">[920, 430, 950, 450]</P>
        <P Name="Port">14</P>
      </Block>
      <Block BlockType="Outport" Name="out_image_transmitted" SID="85">
        <P Name="Position">[990, 415, 1020, 435]</P>
        <P Name="Port">15</P>
      </Block>
      <Block BlockType="Outport" Name="out_image_processed" SID="86">
        <P Name="Position">[1100, 480, 1130, 500]</P>
        <P Name="Port">16</P>
      </Block>
      <Block BlockType="Outport" Name="out_processing_backlog" SID="87">
        <P Name="Position">[1100, 530, 1130, 550]</P>
        <P Name="Port">17</P>
      </Block>
      <Block BlockType="Outport" Name="out_referral_cases" SID="88">
        <P Name="Position">[1220, 485, 1250, 505]</P>
        <P Name="Port">18</P>
      </Block>
      <Block BlockType="Outport" Name="out_cases_reviewed" SID="89">
        <P Name="Position">[1260, 560, 1290, 580]</P>
        <P Name="Port">19</P>
      </Block>
      <Block BlockType="Outport" Name="out_review_backlog" SID="90">
        <P Name="Position">[1260, 620, 1290, 640]</P>
        <P Name="Port">20</P>
      </Block>

    </System>
  </Model>
</ModelInformation>"""


def build_slx(target_path, model_name, blockdiagram_xml):
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    with zipfile.ZipFile(target_path, "w", zipfile.ZIP_DEFLATED) as slx:
        slx.writestr("[Content_Types].xml", create_content_types_xml())
        slx.writestr("_rels/.rels", create_root_rels())
        slx.writestr("simulink/blockdiagram.xml", blockdiagram_xml)
        slx.writestr("simulink/graphicalInterface.xml", create_graphical_interface_xml())
        slx.writestr("simulink/_rels/blockdiagram.xml.rels", create_blockdiagram_rels())
    print(f"✅ Generated Simulink package: {target_path} ({os.path.getsize(target_path)} bytes)")


def main():
    # 1. Generate ResouceAllocation.slx in root and in simulink/
    root_path = os.path.join(os.path.dirname(SIMULINK_DIR), "ResouceAllocation.slx")
    simulink_sub_path = os.path.join(SIMULINK_DIR, "ResouceAllocation.slx")

    xml_content = create_resource_allocation_blockdiagram_xml()
    build_slx(root_path, "ResouceAllocation", xml_content)
    build_slx(simulink_sub_path, "ResouceAllocation", xml_content)
    print("✨ Both ResouceAllocation.slx models built successfully.")


if __name__ == "__main__":
    main()
