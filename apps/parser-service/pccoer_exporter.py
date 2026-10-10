import os
import io
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_borders(cell, top="single", bottom="single", left="single", right="single", color="000000", sz="4"):
    """Set black borders on a cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for border_name, border_style in [('top', top), ('left', left), ('bottom', bottom), ('right', right)]:
        if border_style:
            b = OxmlElement(f'w:{border_name}')
            b.set(qn('w:val'), border_style)
            b.set(qn('w:sz'), sz)
            b.set(qn('w:space'), '0')
            b.set(qn('w:color'), color)
            tcBorders.append(b)
        else:
            b = OxmlElement(f'w:{border_name}')
            b.set(qn('w:val'), 'none')
            tcBorders.append(b)
    tcPr.append(tcBorders)

def set_cell_margins(cell, top=50, bottom=50, left=80, right=80):
    """Set cell padding in dxa (1 pt = 20 dxa)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m_name, m_val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m_name}')
        node.set(qn('w:w'), str(m_val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def make_row_cant_split(row):
    """Ensure table row does not split across pages in Word."""
    trPr = row._tr.get_or_add_trPr()
    trPr.append(OxmlElement('w:cantSplit'))

def generate_pccoer_docx_stream(paper_data: dict) -> io.BytesIO:
    """
    Generate the official PCCOER question paper format in DOCX.
    Returns a BytesIO stream.
    """
    doc = docx.Document()
    
    # Page Margins
    for section in doc.sections:
        section.top_margin = Inches(0.4)
        section.bottom_margin = Inches(0.4)
        section.left_margin = Inches(0.45)
        section.right_margin = Inches(0.45)
        
        # Footer
        footer = section.footer
        f_p = footer.paragraphs[0]
        f_p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        rev_text = f"Rev.: {paper_data.get('rev', '00')}      Date: {paper_data.get('rev_date', '01-09-2025')}"
        r_f1 = f_p.add_run(rev_text)
        r_f1.font.name = 'Times New Roman'
        r_f1.font.size = Pt(9.5)
        
        r_f2 = f_p.add_run("\t\t\t\t\t\t\t\tPage 1 of 2")
        r_f2.font.name = 'Times New Roman'
        r_f2.font.size = Pt(9.5)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    # Check possible logo paths
    logo_paths = [
        os.path.join(base_dir, '..', 'frontend', 'public', 'logos'),
        os.path.join(base_dir, 'logos'),
    ]
    pccoer_logo = None
    pcet_logo = None
    for lp in logo_paths:
        p1 = os.path.join(lp, 'pccoer_logo.jpg')
        p2 = os.path.join(lp, 'pcet_logo.jpg')
        if os.path.exists(p1) and os.path.exists(p2):
            pccoer_logo = p1
            pcet_logo = p2
            break

    # 1. Header Table (3 columns: Left Logo | Center Text | Right Logo)
    header_table = doc.add_table(rows=2, cols=3)
    header_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    header_table.autofit = False

    col_widths = [Inches(1.2), Inches(5.1), Inches(1.1)]
    for row in header_table.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = width

    # Row 0: Logos & Trust Info
    c00 = header_table.cell(0, 0)
    c00.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    p = c00.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if pccoer_logo and os.path.exists(pccoer_logo):
        p.add_run().add_picture(pccoer_logo, width=Inches(1.05))

    c01 = header_table.cell(0, 1)
    c01.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    p = c01.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    r = p.add_run("Pimpri Chinchwad Education Trust's\n")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)
    r.bold = True
    
    r = p.add_run("Pimpri Chinchwad College of Engineering & Research Ravet, Pune\n")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11.5)
    r.bold = True

    r = p.add_run("An Autonomous Institute | NBA Accredited (4 UG Programs) | NAAC A++\nAccredited | ISO 21001:2018 Certified\n")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(9)

    r = p.add_run("IQAC PCCOER")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)
    r.bold = True

    c02 = header_table.cell(0, 2)
    c02.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    p = c02.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if pcet_logo and os.path.exists(pcet_logo):
        p.add_run().add_picture(pcet_logo, width=Inches(0.95))

    # Row 1: Academic Year | UNIT TEST | Record No.
    c10 = header_table.cell(1, 0)
    c10.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    p = c10.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("Academic Year:\n")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(9.5)
    r = p.add_run(f"{paper_data.get('academic_year', '2025 – 26')}\n")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(9.5)
    r = p.add_run(f"Term: {paper_data.get('term', 'II')}")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(9.5)

    c11 = header_table.cell(1, 1)
    c11.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    p = c11.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(f"{paper_data.get('exam_type', 'UNIT TEST')}")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(15)

    c12 = header_table.cell(1, 2)
    c12.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    p = c12.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("Record No.:\n")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(9.5)
    r = p.add_run(f"{paper_data.get('record_no', 'ACAD/R/11')}")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)

    for r_idx in range(2):
        for c_idx in range(3):
            cell = header_table.cell(r_idx, c_idx)
            set_cell_borders(cell, top="single", bottom="single", left="single", right="single", color="000000", sz="6")
            set_cell_margins(cell, top=30, bottom=30, left=50, right=50)

    # 2. Metadata Section (Department, Subject, Marks, etc.)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    
    meta_table = doc.add_table(rows=3, cols=3)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_widths = [Inches(3.4), Inches(2.2), Inches(1.8)]
    for row in meta_table.rows:
        for idx, w in enumerate(meta_widths):
            row.cells[idx].width = w

    # Row 0
    c = meta_table.cell(0, 0)
    p = c.paragraphs[0]
    p.paragraph_format.space_after = Pt(1)
    r = p.add_run("Department: ")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)
    r = p.add_run(paper_data.get('department', 'Computer Engineering'))
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)

    c = meta_table.cell(0, 1)
    p = c.paragraphs[0]
    p.paragraph_format.space_after = Pt(1)
    r = p.add_run("Class: ")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)
    r = p.add_run(paper_data.get('class', 'TE'))
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)

    c = meta_table.cell(0, 2)
    p = c.paragraphs[0]
    p.paragraph_format.space_after = Pt(1)
    r = p.add_run("Div.: ")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)
    r = p.add_run(paper_data.get('div', 'A, B, C, D, E, F'))
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)

    # Row 1
    c = meta_table.cell(1, 0)
    p = c.paragraphs[0]
    p.paragraph_format.space_after = Pt(1)
    r = p.add_run("Subject: ")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)
    r = p.add_run(paper_data.get('subject', ''))
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)

    c = meta_table.cell(1, 1)
    p = c.paragraphs[0]
    p.paragraph_format.space_after = Pt(1)
    r = p.add_run("Maximum Marks: ")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)
    r = p.add_run(str(paper_data.get('max_marks', '30')))
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)

    c = meta_table.cell(1, 2)
    p = c.paragraphs[0]
    p.paragraph_format.space_after = Pt(1)
    r = p.add_run("Duration: ")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)
    r = p.add_run(str(paper_data.get('duration', '60 Min')))
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)

    # Row 2
    c = meta_table.cell(2, 0)
    p = c.paragraphs[0]
    p.paragraph_format.space_after = Pt(1)
    r = p.add_run("Subject Code: ")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)
    r = p.add_run(paper_data.get('subject_code', ''))
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)

    c = meta_table.cell(2, 1)
    p = c.paragraphs[0]
    p.paragraph_format.space_after = Pt(1)

    c = meta_table.cell(2, 2)
    p = c.paragraphs[0]
    p.paragraph_format.space_after = Pt(1)
    r = p.add_run("Date: ")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)
    r = p.add_run(paper_data.get('date', ''))
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)

    for row in meta_table.rows:
        for cell in row.cells:
            set_cell_borders(cell, top=None, bottom=None, left=None, right=None)
            set_cell_margins(cell, top=15, bottom=15, left=30, right=30)

    # 3. Notes
    p_note = doc.add_paragraph()
    p_note.paragraph_format.space_before = Pt(4)
    p_note.paragraph_format.space_after = Pt(1)
    r = p_note.add_run("Note:  1. Solve Que.1 or Que.2 and Que.3 or Que.4.\n")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)
    r.italic = True
    r.bold = True
    r = p_note.add_run("          2. Give explanation or justification wherever required.")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)
    r.italic = True

    # 4. Course Outcomes Table
    p_co_label = doc.add_paragraph()
    p_co_label.paragraph_format.space_before = Pt(4)
    p_co_label.paragraph_format.space_after = Pt(2)
    r = p_co_label.add_run("Course Outcomes:")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)

    co_list = paper_data.get('co_list', [])
    if not co_list:
        co_list = [
            {'co': 'CO1', 'desc': 'Understand the fundamental concepts and principles of the subject.', 'bt': 'L2'},
            {'co': 'CO2', 'desc': 'Apply analytical techniques and methodologies to solve domain problems.', 'bt': 'L3'},
            {'co': 'CO3', 'desc': 'Design and evaluate architectural models and practical solutions.', 'bt': 'L3'},
        ]

    co_table = doc.add_table(rows=1 + len(co_list), cols=3)
    co_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    co_widths = [Inches(0.9), Inches(5.3), Inches(1.2)]
    for row in co_table.rows:
        for idx, w in enumerate(co_widths):
            row.cells[idx].width = w

    headers = ["CO", "Course Outcomes", "BT Level"]
    for idx, text in enumerate(headers):
        cell = co_table.cell(0, idx)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(text)
        r.bold = True
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10)
        set_cell_borders(cell, top="single", bottom="single", left="single", right="single", color="000000", sz="6")
        set_cell_margins(cell, top=25, bottom=25, left=30, right=30)

    for r_idx, co_item in enumerate(co_list):
        cell_co = co_table.cell(r_idx + 1, 0)
        p = cell_co.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(co_item.get('co', f'CO{r_idx+1}'))
        r.bold = True
        r.font.name = 'Times New Roman'
        r.font.size = Pt(9.5)
        set_cell_borders(cell_co, top="single", bottom="single", left="single", right="single", color="000000", sz="6")

        cell_desc = co_table.cell(r_idx + 1, 1)
        p = cell_desc.paragraphs[0]
        r = p.add_run(co_item.get('desc', ''))
        r.font.name = 'Times New Roman'
        r.font.size = Pt(9.5)
        set_cell_borders(cell_desc, top="single", bottom="single", left="single", right="single", color="000000", sz="6")

        cell_bt = co_table.cell(r_idx + 1, 2)
        p = cell_bt.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(co_item.get('bt', 'L2'))
        r.font.name = 'Times New Roman'
        r.font.size = Pt(9.5)
        set_cell_borders(cell_bt, top="single", bottom="single", left="single", right="single", color="000000", sz="6")

    # 5. Main Questions Table
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    raw_questions = paper_data.get('questions', [])
    # Flatten or normalize questions
    normalized_q = []
    if raw_questions and isinstance(raw_questions[0], dict) and 'que' in raw_questions[0]:
        normalized_q = raw_questions
    elif paper_data.get('sections'):
        # Convert sections to standard PCCOER question list with OR
        sections = paper_data.get('sections', [])
        q_counter = 1
        for s_idx, sec in enumerate(sections):
            sec_qs = sec.get('questions', [])
            for q_idx, q in enumerate(sec_qs):
                sub_label = chr(65 + (q_idx % 3))
                btl = q.get('blooms_level', 'L2').split('_')[0] if q.get('blooms_level') else 'L2'
                co_val = q.get('co') or f"CO{(s_idx % 3) + 1}"
                marks_val = q.get('marks', 5)
                normalized_q.append({
                    'que': str(q_counter),
                    'sub': sub_label,
                    'text': q.get('text', ''),
                    'marks_co_btl': f"{marks_val} / {co_val} / {btl}",
                    'pi': q.get('pi', '1.1.1')
                })
                if (q_idx + 1) % 3 == 0 and (q_idx + 1) < len(sec_qs):
                    normalized_q.append({'type': 'OR'})
                    q_counter += 1
            if s_idx < len(sections) - 1:
                normalized_q.append({'type': 'OR'})
                q_counter += 1

    q_table = doc.add_table(rows=1, cols=5)
    q_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    q_widths = [Inches(0.5), Inches(0.55), Inches(4.75), Inches(1.1), Inches(0.5)]
    for idx, w in enumerate(q_widths):
        q_table.rows[0].cells[idx].width = w

    q_headers = ["Que", "Sub\nQue.", "Questions", "Marks/\nCO/BTL", "PI"]
    for idx, text in enumerate(q_headers):
        cell = q_table.cell(0, idx)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(text)
        r.bold = True
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10)
        set_cell_borders(cell, top="single", bottom="single", left="single", right="single", color="000000", sz="6")
        set_cell_margins(cell, top=30, bottom=30, left=30, right=30)

    # Track row ranges for each question group to merge column 0 vertically
    que_row_groups = []
    current_que_num = None
    group_start_idx = None

    for item in normalized_q:
        row = q_table.add_row()
        make_row_cant_split(row)
        current_row_idx = len(q_table.rows) - 1
        for idx, w in enumerate(q_widths):
            row.cells[idx].width = w

        if item.get('type') == 'OR':
            if current_que_num is not None and group_start_idx is not None:
                que_row_groups.append((current_que_num, group_start_idx, current_row_idx - 1))
                current_que_num = None
                group_start_idx = None

            merged = row.cells[0].merge(row.cells[1]).merge(row.cells[2]).merge(row.cells[3]).merge(row.cells[4])
            merged.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p = merged.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.keep_with_next = True
            r = p.add_run("OR")
            r.bold = True
            r.font.name = 'Times New Roman'
            r.font.size = Pt(11)
            set_cell_borders(merged, top="single", bottom="single", left="single", right="single", color="000000", sz="6")
            set_cell_margins(merged, top=15, bottom=15, left=30, right=30)
        else:
            item_que = item.get('que', '')
            if item_que != current_que_num:
                if current_que_num is not None and group_start_idx is not None:
                    que_row_groups.append((current_que_num, group_start_idx, current_row_idx - 1))
                current_que_num = item_que
                group_start_idx = current_row_idx

            c0 = row.cells[0]
            c0.vertical_alignment = WD_ALIGN_VERTICAL.CENTER

            c1 = row.cells[1]
            p = c1.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(item.get('sub', ''))
            r.bold = True
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10)

            c2 = row.cells[2]
            p = c2.paragraphs[0]
            r = p.add_run(item.get('text', ''))
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10)

            c3 = row.cells[3]
            p = c3.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(item.get('marks_co_btl', ''))
            r.font.name = 'Times New Roman'
            r.font.size = Pt(9.5)

            c4 = row.cells[4]
            p = c4.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(item.get('pi', ''))
            r.font.name = 'Times New Roman'
            r.font.size = Pt(9.5)

            for cell in row.cells:
                set_cell_borders(cell, top="single", bottom="single", left="single", right="single", color="000000", sz="6")
                set_cell_margins(cell, top=30, bottom=30, left=30, right=30)

    # Finalize last question group if any
    if current_que_num is not None and group_start_idx is not None:
        que_row_groups.append((current_que_num, group_start_idx, len(q_table.rows) - 1))

    # Vertically merge Que column (cell 0) across all sub-questions for each question group
    # and keep all sub-questions of that question together on the same page
    for que_num, s_idx, e_idx in que_row_groups:
        start_cell = q_table.cell(s_idx, 0)
        if s_idx < e_idx:
            end_cell = q_table.cell(e_idx, 0)
            merged_que_cell = start_cell.merge(end_cell)
            # Prevent splitting across pages between sub-questions of the same question
            for r_i in range(s_idx, e_idx):
                for cell in q_table.rows[r_i].cells:
                    for cp in cell.paragraphs:
                        cp.paragraph_format.keep_with_next = True
        else:
            merged_que_cell = start_cell

        merged_que_cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        p = merged_que_cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.text = ""
        r = p.add_run(str(que_num))
        r.bold = True
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11)
        set_cell_borders(merged_que_cell, top="single", bottom="single", left="single", right="single", color="000000", sz="6")
        set_cell_margins(merged_que_cell, top=30, bottom=30, left=30, right=30)

    stream = io.BytesIO()
    doc.save(stream)
    stream.seek(0)
    return stream
