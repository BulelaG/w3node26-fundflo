import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "FundFlow — Team Master Brief & Architecture Guide | W3Node Hackathon 2026")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)
            
        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)
        
        self.drawString(54, 32, "Confidential — For Internal FundFlow Development Team (WeThinkCode)")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 32, page_str)
        self.restoreState()

def create_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Palette
    c_primary = colors.HexColor("#0F172A")    # Deep Navy
    c_accent = colors.HexColor("#0284C7")     # Vivid Cyan/Blue
    c_text = colors.HexColor("#334155")       # Charcoal text
    c_light_bg = colors.HexColor("#F8FAFC")   # Light Slate Box
    c_border = colors.HexColor("#E2E8F0")     # Slate Border
    c_danger = colors.HexColor("#B91C1C")     # Crimson
    c_success = colors.HexColor("#15803D")    # Forest Green

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=c_primary,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=c_accent,
        spaceAfter=15
    )
    
    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=c_accent,
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=c_text,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=body_style,
        leftIndent=14,
        bulletIndent=4,
        spaceAfter=4
    )

    callout_style = ParagraphStyle(
        'Callout',
        parent=body_style,
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1E293B")
    )
    
    code_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0F172A")
    )

    story = []

    # Title Banner
    story.append(Paragraph("FundFlow — Project Master Brief & Architecture", title_style))
    story.append(Paragraph("AI-Powered Student Funding Disbursement & Assurance Platform | W3Node 2026", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_accent, spaceBefore=0, spaceAfter=12))

    # Executive Summary Box
    summary_html = (
        "<b>Executive Purpose:</b> This document gives our distributed 2-person development team full alignment on "
        "FundFlow's architecture, problem statement, real-world data, technical design, and Git workflow. "
        "Developer 1 (MERN Stack) and Developer 2 (Agentic Finance & XRPL) will use this manual alongside GitHub Copilot CLI "
        "to rapidly build and demo a working Agentic Finance MVP for the Ripple-sponsored W3Node Hackathon track."
    )
    summary_table = Table(
        [[Paragraph(summary_html, callout_style)]],
        colWidths=[504]
    )
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_light_bg),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 14))

    # Section 1: The Problem & Real South African Data
    story.append(Paragraph("1. The Real-World Problem: Grounding in Verified Data", h1_style))
    story.append(Paragraph(
        "South African student funding (NSFAS, corporate bursaries, trust funds) suffers from recurring governance and disbursement failures. "
        "To win over hackathon judges and prove commercial viability, we cite these official investigative findings:",
        body_style
    ))

    data_items = [
        ("<b>R5+ Billion in Ineligible Allocations (SIU):</b> The Special Investigating Unit (Proclamation R.88 of 2022) revealed over 40,000 ineligible beneficiaries inappropriately received allowances—including ghost students, dropouts, deceased identities, and students exceeding income thresholds."),
        ("<b>R2+ Billion in Trapped Unallocated Cash:</b> Poor system integration between funding bodies and institutions left billions stranded in university accounts for years. The SIU had to claw back over R1.7 Billion from universities (e.g. UJ and UFS) due to lack of real-time payment reconciliation."),
        ("<b>The R47-Billion Direct Payment Scandal (Werksmans Report):</b> In 2023, four fintech providers (eZaga, Coinvest, Norraco, Tenet Technology) were awarded direct disbursement tenders. The independent Werksmans report and court judgments declared the tenders unlawful and unconstitutional, exposing deep conflicts of interest."),
        ("<b>Predatory Fee Deductions on Impoverished Students:</b> The fintech middlemen charged students monthly bank fees (R12 to R29/month) plus ATM withdrawal fees, eroding monthly allowances intended for basic food and accommodation."),
        ("<b>Repeated Qualified Audits by Auditor-General (AGSA):</b> AGSA repeatedly flags student funding bodies for absence of automated internal controls, broken audit trails, and reconciliation books that do not match ledger records.")
    ]
    for item in data_items:
        story.append(Paragraph(f"• {item}", bullet_style))

    story.append(Spacer(1, 10))

    # Section 2: Hackathon Objective & Ripple Criteria
    story.append(Paragraph("2. The Ripple Agentic Finance Criteria", h1_style))
    story.append(Paragraph(
        "The workshop led by Maxime Dienger (Ripple) established explicit criteria for what wins this track ($2,500 prize + UDAX accelerator interview):",
        body_style
    ))
    
    criteria_table_data = [
        [Paragraph("<b>Criteria</b>", body_style), Paragraph("<b>Ripple Requirement</b>", body_style), Paragraph("<b>FundFlow Implementation</b>", body_style)],
        [
            Paragraph("<b>Core Question</b>", body_style),
            Paragraph("<i>'Would your CFO sign off?'</i> Requires clear limits, auditability, and emergency stop.", body_style),
            Paragraph("Admin sets mandates, budgets, and beneficiary allowances with an instant pause switch.", body_style)
        ],
        [
            Paragraph("<b>No Chatbots</b>", body_style),
            Paragraph("Autonomous agent action. NOT a chatbot asking a human to click 'Approve'.", body_style),
            Paragraph("Autonomous worker cycle evaluates schedules and dispatches payments without human intervention.", body_style)
        ],
        [
            Paragraph("<b>Out-of-Agent Policy</b>", body_style),
            Paragraph("Limits enforced where the agent cannot alter or bypass them.", body_style),
            Paragraph("Independent Policy Engine intercepts requests and checks mandates before signing.", body_style)
        ],
        [
            Paragraph("<b>The Blocked Demo</b>", body_style),
            Paragraph("<i>'A demo where the agent gets blocked beats one that only shows the happy path.'</i>", body_style),
            Paragraph("Demo shows: (1) Valid payment settles, (2) Duplicate/over-budget payment is blocked with audit code.", body_style)
        ],
        [
            Paragraph("<b>XRPL Settlement</b>", body_style),
            Paragraph("Actual transaction on XRPL Testnet with immutable hash verification.", body_style),
            Paragraph("Node.js `xrpl.js` signs and submits payments; records `tesSUCCESS` hashes.", body_style)
        ]
    ]
    t_criteria = Table(criteria_table_data, colWidths=[100, 204, 200])
    t_criteria.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_criteria)

    story.append(PageBreak())

    # Section 3: Architecture & System Flow
    story.append(Paragraph("3. FundFlow System Architecture", h1_style))
    story.append(Paragraph(
        "FundFlow is built as a clean modular monolith using the MERN stack with dedicated security boundaries for AI and XRPL.",
        body_style
    ))

    arch_points = [
        "<b>Frontend (React + Vite):</b> Split into (1) <i>Admin Dashboard</i> (mandates, limits, live audit stream, kill-switch) and (2) <i>Student Portal</i> (status cards, payment schedule, direct XRPL Explorer transaction links). Styled with a high-contrast Navy & Cyan fintech theme.",
        "<b>Backend REST API (Node.js & Express):</b> Houses CRUD controllers for programmes, beneficiaries, payment schedules, and audit records.",
        "<b>AI Disbursement Agent:</b> Autonomous service that evaluates active mandates and scheduled disbursements, prepares payment instructions, and submits them to the policy engine. <i>The agent never has access to private keys or wallet seeds!</i>",
        "<b>Independent Policy Engine (Zero-Trust Gate):</b> An independent, non-AI security module. Validates: (1) Is beneficiary whitelisted? (2) Does amount exceed student allowance? (3) Does program have sufficient budget? (4) Has this payment already occurred (Idempotency lock)? (5) Is programme active?",
        "<b>XRPL Transaction Service (`xrpl.js`):</b> Securely holds server-side signing keys. Submits transactions to XRPL Testnet, waits for validation, checks `tesSUCCESS`, and returns immutable transaction hashes to the audit log.",
        "<b>MongoDB / Mongoose:</b> Stores programmes, synthetic students, payment schedules, and immutable audit logs."
    ]
    for pt in arch_points:
        story.append(Paragraph(f"• {pt}", bullet_style))

    story.append(Spacer(1, 10))

    # Architecture Data Flow Diagram
    story.append(Paragraph("End-to-End Payment Sequence Flow:", h2_style))
    flow_steps = [
        "1. Admin defines Funding Programme (Budget: R50,000, Whitelisted Students, Monthly Allowance: R1,650).",
        "2. AI Disbursement Agent scans database for due scheduled payments.",
        "3. Agent prepares payment proposal: { studentId: 'STU-001', amount: 1650, programmeId: 'PRG-01' }.",
        "4. Independent Policy Engine independently queries database mandate (ignoring any agent claims).",
        "5. Policy Engine verifies rules: beneficiary valid, budget sufficient, payment not duplicate.",
        "6. If Approved: Policy Engine passes approved instruction to XRPL Transaction Service.",
        "7. XRPL Service signs and submits payment transaction to XRPL Testnet.",
        "8. Testnet settles in ~4 seconds; returns `tesSUCCESS` and 64-character hash.",
        "9. System records verified transaction hash in MongoDB Audit Log.",
        "10. Student Portal shows 'Verified' green badge with link to `testnet.xrpl.org`.",
        "11. If Blocked: Policy Engine rejects immediately with reason code (e.g., `ERR_DUPLICATE_PAYMENT`), no funds move, and the exception is logged for the Admin."
    ]
    for s in flow_steps:
        story.append(Paragraph(s, bullet_style))

    story.append(Spacer(1, 12))

    # Section 4: Two-Developer Role Division
    story.append(Paragraph("4. Two-Developer Team Division of Responsibilities", h1_style))
    
    team_table_data = [
        [Paragraph("<b>Area</b>", body_style), Paragraph("<b>Developer 1 (MERN Application)</b>", body_style), Paragraph("<b>Developer 2 (Agentic Finance & XRPL)</b>", body_style)],
        [
            Paragraph("<b>Focus</b>", body_style),
            Paragraph("User Experience, Dashboards & REST Endpoints", body_style),
            Paragraph("Blockchain Settlement, Policy Gate & Agent Logic", body_style)
        ],
        [
            Paragraph("<b>Key Tasks</b>", body_style),
            Paragraph(
                "• React + Vite Admin Dashboard<br/>"
                "• Student Portal with XRPL Explorer links<br/>"
                "• Express routes & Mongoose models<br/>"
                "• Navy/Cyan UI styling & status badges<br/>"
                "• Frontend API integration",
                body_style
            ),
            Paragraph(
                "• XRPL Testnet connection (`xrpl.js`)<br/>"
                "• Faucet auto-funding & transaction service<br/>"
                "• Independent Policy Engine (Zero-Trust checks)<br/>"
                "• Autonomous AI agent evaluation loop<br/>"
                "• Security test scripts (duplicate/over-budget)",
                body_style
            )
        ],
        [
            Paragraph("<b>Shared</b>", body_style),
            Paragraph("Collaborate on `docs/API_SPEC.md` so UI and backend services integrate seamlessly without waiting.", body_style),
            Paragraph("Review each other's pull requests and participate in demo rehearsal.", body_style)
        ]
    ]
    t_team = Table(team_table_data, colWidths=[80, 214, 210])
    t_team.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_team)

    story.append(PageBreak())

    # Section 5: Remote Work & Git + GitHub Copilot CLI Workflow
    story.append(Paragraph("5. Git Workflow & Remote Collaboration Strategy", h1_style))
    story.append(Paragraph(
        "Because Developer 1 and Developer 2 are working remotely using Git and GitHub Copilot CLI, strict branch hygiene prevents merge conflicts:",
        body_style
    ))

    git_steps = [
        "<b>Main Branch (`main`):</b> Always working, deployable, and demo-ready. Never push code directly to `main`.",
        "<b>Development Integration Branch (`dev`):</b> Where feature branches are merged after testing.",
        "<b>Feature Branches:</b><br/>"
        "&nbsp;&nbsp;• <code>feature/dev1-admin-student-ui</code> (Developer 1)<br/>"
        "&nbsp;&nbsp;• <code>feature/dev1-api-routes</code> (Developer 1)<br/>"
        "&nbsp;&nbsp;• <code>feature/dev2-xrpl-service</code> (Developer 2)<br/>"
        "&nbsp;&nbsp;• <code>feature/dev2-policy-engine</code> (Developer 2)<br/>"
        "&nbsp;&nbsp;• <code>feature/dev2-disbursement-agent</code> (Developer 2)",
        "<b>Git Secret Protection:</b> <code>.env</code> and wallet seed files must NEVER be tracked in Git. The <code>.gitignore</code> file is the first file committed.",
        "<b>GitHub Copilot CLI Best Practices:</b><br/>"
        "&nbsp;&nbsp;• Give Copilot specific context: <i>'Using xrpl.js, submit an XRP payment from seed X to student address Y and await tesSUCCESS.'</i><br/>"
        "&nbsp;&nbsp;• Keep functions small and modular so Copilot generates exact, unit-testable code."
    ]
    for gs in git_steps:
        story.append(Paragraph(f"• {gs}", bullet_style))

    story.append(Spacer(1, 10))

    # Section 6: Educational Primer for XRPL & Agentic Finance
    story.append(Paragraph("6. Developer Education: XRPL & Agentic Finance Primer", h1_style))
    
    edu_text = (
        "<b>1. Understanding XRPL (XRP Ledger):</b><br/>"
        "• <b>Speed & Settlement:</b> XRPL does not use proof-of-work or smart contract auctions. It uses the Ripple Protocol Consensus Algorithm (RPCA), settling in 3–5 seconds with irreversible finality.<br/>"
        "• <b>Base Reserve:</b> Every XRPL account requires 1 XRP minimum reserve to exist on ledger.<br/>"
        "• <b>Drops:</b> 1 XRP = 1,000,000 drops. When sending transactions via <code>xrpl.js</code>, use <code>xrpl.xrpToDrops('10')</code>.<br/>"
        "• <b>Result Verification:</b> Always verify <code>result.meta.TransactionResult === 'tesSUCCESS'</code>.<br/><br/>"
        "<b>2. Understanding Autonomous Agents:</b><br/>"
        "• An agent is not a chatbot. It operates on a continuous loop: <i>Sense</i> (read pending payment schedules) → <i>Plan</i> (construct transaction parameters) → <i>Act</i> (invoke the Policy Engine).<br/>"
        "• <b>The Golden Rule of Agentic Security:</b> <i>Never give an LLM direct access to wallet signing keys or allow it to validate its own rules.</i> The agent is an unprivileged proposer; the Policy Engine is the deterministic gatekeeper."
    )
    story.append(Paragraph(edu_text, body_style))

    story.append(Spacer(1, 10))

    # Section 7: Three Milestones & Checklist
    story.append(Paragraph("7. Implementation Checklist (Milestones 1 to 3)", h1_style))
    
    checklist_data = [
        [Paragraph("<b>Milestone</b>", body_style), Paragraph("<b>Key Deliverables</b>", body_style), Paragraph("<b>Status</b>", body_style)],
        [
            Paragraph("<b>M1: Monorepo & Git</b>", body_style),
            Paragraph("Initialize git, <code>.gitignore</code>, scaffold <code>server/</code> and <code>client/</code>, configure DB fallback, define <code>API_SPEC.md</code>.", body_style),
            Paragraph("<font color='#15803D'><b>In Progress</b></font>", body_style)
        ],
        [
            Paragraph("<b>M2: Policy & XRPL</b>", body_style),
            Paragraph("XRPL Testnet connection, faucet auto-funding, independent policy validation rules, duplicate prevention tests.", body_style),
            Paragraph("Queued", body_style)
        ],
        [
            Paragraph("<b>M3: Agent & Dashboards</b>", body_style),
            Paragraph("Autonomous agent scheduler, Admin Dashboard with kill-switch, Student Portal with explorer links, end-to-end demo rehearsal.", body_style),
            Paragraph("Queued", body_style)
        ]
    ]
    t_check = Table(checklist_data, colWidths=[110, 314, 80])
    t_check.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_check)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {output_path}")

if __name__ == '__main__':
    target = os.path.join(os.path.dirname(__file__), "FundFlow_Team_Brief_and_Architecture.pdf")
    create_pdf(target)
