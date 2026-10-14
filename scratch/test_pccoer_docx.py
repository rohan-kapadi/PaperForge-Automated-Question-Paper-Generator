import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

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

def set_cell_margins(cell, top=60, bottom=60, left=100, right=100):
    """Set inner cell padding in dxa (1 pt = 20 dxa)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m_name, m_val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m_name}')
        node.set(qn('w:w'), str(m_val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def generate_pccoer_paper_docx(output_path, paper_data=None):
    if paper_data is None:
        paper_data = {
            'department': 'Computer Engineering',
            'subject': 'Database Management Systems',
            'subject_code': 'CS301PC',
            'class': 'TE',
            'div': 'A, B, C, D, E, F',
            'academic_year': '2025 – 26',
            'term': 'II',
            'exam_type': 'UNIT TEST',
            'max_marks': '30',
            'duration': '60 Min',
            'date': '01-09-2025',
            'record_no': 'ACAD/R/11',
            'rev': '00',
            'rev_date': '01-09-2025',
            'co_list': [
                {'co': 'CO1', 'desc': 'Understand the fundamental concepts of database systems and data models.', 'bt': 'L2'},
                {'co': 'CO2', 'desc': 'Design conceptual database schemas using Entity-Relationship modeling.', 'bt': 'L3'},
                {'co': 'CO3', 'desc': 'Formulate relational algebra and SQL queries to retrieve and manipulate data.', 'bt': 'L3'},
            ],
            'questions': [
                # Que 1
                {'que': '1', 'sub': 'A', 'text': 'Explain the three-tier database architecture with a neat schematic diagram.', 'marks_co_btl': '5 / CO1 / L2', 'pi': '1.3.1'},
                {'que': '1', 'sub': 'B', 'text': 'Differentiate between File Processing System and Database Management System.', 'marks_co_btl': '5 / CO1 / L2', 'pi': '1.3.1'},
                {'que': '1', 'sub': 'C', 'text': 'State the roles and responsibilities of a Database Administrator (DBA).', 'marks_co_btl': '5 / CO1 / L1', 'pi': '1.2.1'},
                # OR separator
                {'type': 'OR'},
                # Que 2
                {'que': '2', 'sub': 'A', 'text': 'Define Data Independence. Explain Logical and Physical Data Independence with examples.', 'marks_co_btl': '5 / CO1 / L2', 'pi': '1.3.1'},
                {'que': '2', 'sub': 'B', 'text': 'Construct an ER diagram for a Hospital Management System with appropriate entities, attributes, and relationships.', 'marks_co_btl': '5 / CO2 / L3', 'pi': '2.1.2'},
                {'que': '2', 'sub': 'C', 'text': 'Explain generalization, specialization, and aggregation with suitable illustrations.', 'marks_co_btl': '5 / CO2 / L2', 'pi': '2.1.1'},
                # Page break or continuation
                # Que 3
                {'que': '3', 'sub': 'A', 'text': 'What is Relational Algebra? Explain fundamental relational algebra operations with examples.', 'marks_co_btl': '5 / CO3 / L2', 'pi': '1.4.1'},
                {'que': '3', 'sub': 'B', 'text': 'Given relation schema Employee(eid, ename, salary, did), write relational algebra expressions to retrieve employees with salary > 50000.', 'marks_co_btl': '5 / CO3 / L3', 'pi': '2.2.1'},
                {'que': '3', 'sub': 'C', 'text': 'Explain Primary Key, Foreign Key, Candidate Key, and Super Key with schema examples.', 'marks_co_btl': '5 / CO2 / L2', 'pi': '1.2.2'},
                # OR separator
                {'type': 'OR'},
                # Que 4
                {'que': '4', 'sub': 'A', 'text': 'Explain various DDL and DML commands in SQL with their syntax and sample queries.', 'marks_co_btl': '5 / CO3 / L2', 'pi': '1.4.1'},
                {'que': '4', 'sub': 'B', 'text': 'Discuss aggregate functions in SQL (COUNT, SUM, AVG, MIN, MAX) along with GROUP BY and HAVING clauses.', 'marks_co_btl': '5 / CO3 / L3', 'pi': '2.2.2'},
                {'que': '4', 'sub': 'C', 'text': 'Illustrate nested subqueries and correlated subqueries with suitable relational queries.', 'marks_co_btl': '5 / CO3 / L3', 'pi': '2.2.2'},
            ]
        }

    doc = docx.Document()
    
    # Set page margins to 0.45 in (narrow margins like the official format)
    for section in doc.sections:
        section.top_margin = Inches(0.4)
        section.bottom_margin = Inches(0.4)
        section.left_margin = Inches(0.45)
        section.right_margin = Inches(0.45)
        
        # Setup Footer
        footer = section.footer
        f_p = footer.paragraphs[0]
        f_p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        f_run1 = f_p.add_run(f"Rev.: {paper_data.get('rev', '00')}      Date: {paper_data.get('rev_date', '01-09-2025')}")
        f_run1.font.name = 'Times New Roman'
        f_run1.font.size = Pt(9.5)
        
        # Tab stop for right alignment
        f_run2 = f_p.add_run("\t\t\t\t\t\t\t\tPage 1 of 2")
        f_run2.font.name = 'Times New Roman'
        f_run2.font.size = Pt(9.5)

    base_logo_dir = os.path.abspath('apps/frontend/public/logos')
    pccoer_logo = os.path.join(base_logo_dir, 'pccoer_logo.png')
    pcet_logo = os.path.join(base_logo_dir, 'pcet_logo.png')

    # 1. Header Table (3 columns: Left Logo | Center Text | Right Logo)
    header_table = doc.add_table(rows=2, cols=3)
    header_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    header_table.autofit = False

    col_widths = [Inches(1.2), Inches(5.1), Inches(1.1)]
    for row in header_table.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = width

    # Row 0: Logos & Title
    c00 = header_table.cell(0, 0)
    c00.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    p = c00.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if os.path.exists(pccoer_logo):
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
    if os.path.exists(pcet_logo):
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

    # Apply borders to header table cells
    for r_idx in range(2):
        for c_idx in range(3):
            cell = header_table.cell(r_idx, c_idx)
            set_cell_borders(cell, top="single", bottom="single", left="single", right="single", color="000000", sz="6")
            set_cell_margins(cell, top=40, bottom=40, left=60, right=60)

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

    # Meta table has no borders or subtle borders
    for row in meta_table.rows:
        for cell in row.cells:
            set_cell_borders(cell, top=None, bottom=None, left=None, right=None)
            set_cell_margins(cell, top=20, bottom=20, left=40, right=40)

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
    co_table = doc.add_table(rows=1 + len(co_list), cols=3)
    co_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    co_widths = [Inches(0.9), Inches(5.3), Inches(1.2)]
    for row in co_table.rows:
        for idx, w in enumerate(co_widths):
            row.cells[idx].width = w

    # CO Header Row
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
        set_cell_margins(cell, top=30, bottom=30, left=40, right=40)

    # CO Rows
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

    q_items = paper_data.get('questions', [])
    q_table = doc.add_table(rows=1, cols=5)
    q_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    q_widths = [Inches(0.5), Inches(0.55), Inches(4.75), Inches(1.1), Inches(0.5)]
    
    for idx, w in enumerate(q_widths):
        q_table.rows[0].cells[idx].width = w

    # Question Header Row
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
        set_cell_margins(cell, top=30, bottom=30, left=40, right=40)

    # Add Questions Rows
    for item in q_items:
        row = q_table.add_row()
        for idx, w in enumerate(q_widths):
            row.cells[idx].width = w

        if item.get('type') == 'OR':
            # Merge all 5 cells for OR row
            merged = row.cells[0].merge(row.cells[1]).merge(row.cells[2]).merge(row.cells[3]).merge(row.cells[4])
            merged.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p = merged.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run("OR")
            r.bold = True
            r.font.name = 'Times New Roman'
            r.font.size = Pt(11)
            set_cell_borders(merged, top="single", bottom="single", left="single", right="single", color="000000", sz="6")
            set_cell_margins(merged, top=20, bottom=20, left=40, right=40)
        else:
            # Col 0: Que
            c0 = row.cells[0]
            p = c0.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(item.get('que', ''))
            r.bold = True
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10)

            # Col 1: Sub Que
            c1 = row.cells[1]
            p = c1.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(item.get('sub', ''))
            r.bold = True
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10)

            # Col 2: Questions Text
            c2 = row.cells[2]
            p = c2.paragraphs[0]
            r = p.add_run(item.get('text', ''))
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10)

            # Col 3: Marks / CO / BTL
            c3 = row.cells[3]
            p = c3.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(item.get('marks_co_btl', ''))
            r.font.name = 'Times New Roman'
            r.font.size = Pt(9.5)

            # Col 4: PI
            c4 = row.cells[4]
            p = c4.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(item.get('pi', ''))
            r.font.name = 'Times New Roman'
            r.font.size = Pt(9.5)

            for cell in row.cells:
                set_cell_borders(cell, top="single", bottom="single", left="single", right="single", color="000000", sz="6")
                set_cell_margins(cell, top=40, bottom=40, left=40, right=40)

    doc.save(output_path)
    print(f"Generated PCCOER exam paper at: {output_path}")

if __name__ == "__main__":
    out = "/Users/swarajkarle/.gemini/antigravity-ide/brain/f7360c14-cd60-4516-9c66-51175dfad9b4/scratch/test_pccoer_paper.docx"
    generate_pccoer_paper_docx(out)
