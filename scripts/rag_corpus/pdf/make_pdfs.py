"""Builds Module 5 Lesson 5's PDF corpus: four registry-themed PDFs with page headers and footers,
ruled tables, and two raster images (a chart and a diagram) that have no text layer."""
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Image, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

OUT = Path(__file__).parent / "pdfs"
OUT.mkdir(exist_ok=True)
styles = getSampleStyleSheet()
RULED = TableStyle([("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold")])

def furniture(title):
    def draw(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.drawString(2 * cm, A4[1] - 1.2 * cm, f"Registry platform — {title} — INTERNAL")
        canvas.drawRightString(A4[0] - 2 * cm, 1.2 * cm, f"Page {doc.page}")
        canvas.restoreState()
    return draw

def build(name, title, story):
    doc = SimpleDocTemplate(str(OUT / name), pagesize=A4, title=title, topMargin=2.2 * cm, bottomMargin=2.2 * cm)
    doc.build(story, onFirstPage=furniture(title), onLaterPages=furniture(title))

def para(text, style="BodyText"):
    return Paragraph(text, styles[style])

def table(rows, widths=None):
    t = Table(rows, colWidths=widths)
    t.setStyle(RULED)
    return t

# the weekly rate-limiting chart
weeks = ["Jul 6", "Jul 13", "Jul 20", "Jul 27", "Aug 3", "Aug 10", "Aug 17", "Aug 24", "Aug 31",
         "Sep 7", "Sep 14", "Sep 21", "Sep 28"]
limited = [2900, 3100, 3350, 3800, 4200, 3900, 2100, 1300, 900, 720, 560, 430, 310]
fig, ax = plt.subplots(figsize=(7, 3.2), dpi=150)
ax.bar(weeks, limited, color="#4a78b5")
ax.set_title("Rate-limited registry requests (REG-1009) per week, Q3 2026")
ax.set_ylabel("Requests")
ax.tick_params(axis="x", rotation=45)
ax.axvline(6.5, color="#c0392b", linestyle="--")
ax.text(6.6, 4000, "Dashboards moved\nto their own keys", color="#c0392b", fontsize=8)
fig.tight_layout()
fig.savefig(OUT / "rate-limited-chart.png")
plt.close(fig)

# the service dependency diagram
fig, ax = plt.subplots(figsize=(7, 3.6), dpi=150)
ax.set_xlim(0, 10)
ax.set_ylim(0, 5)
ax.axis("off")
boxes = {"notification-service": (1.6, 4.0), "monitoring": (5.0, 4.0), "registry-api": (3.3, 2.3),
         "auth-service": (1.4, 0.7), "registry-db": (5.2, 0.7), "kb-search": (8.3, 2.3)}
for label, (x, y) in boxes.items():
    ax.add_patch(FancyBboxPatch((x - 1.2, y - 0.35), 2.4, 0.7, boxstyle="round,pad=0.05", fc="#eaf1fb", ec="#2c3e50"))
    ax.text(x, y, label, ha="center", va="center", fontsize=9)
for start, end in [("notification-service", "registry-api"), ("notification-service", "auth-service"),
                   ("monitoring", "registry-api"), ("registry-api", "auth-service"), ("registry-api", "registry-db")]:
    (x1, y1), (x2, y2) = boxes[start], boxes[end]
    ax.add_patch(FancyArrowPatch((x1, y1 - 0.4), (x2, y2 + 0.4), arrowstyle="-|>", mutation_scale=12, color="#2c3e50"))
fig.tight_layout()
fig.savefig(OUT / "dependency-diagram.png")
plt.close(fig)

build("P01-ops-review-q3.pdf", "Quarterly operations review, Q3 2026", [
    para("Quarterly operations review, Q3 2026", "Title"),
    para("Availability", "Heading2"),
    para("The registry met its availability target in July and September, and missed it in August because of "
         "INC-2093, the 42-minute outage during a database failover. The target is 99.9% for every month."),
    Spacer(1, 10),
    table([["Month", "Availability", "Target", "Incidents"],
           ["July", "99.97%", "99.9%", "0"],
           ["August", "99.84%", "99.9%", "1 (INC-2093)"],
           ["September", "99.95%", "99.9%", "0"]]),
    Spacer(1, 12),
    para("Latency", "Heading2"),
    para("Median and p95 response times held steady for most agents. research_agent's p95 rose in June when "
         "kb-search served stale cached results quickly, then returned to normal once the cache was fixed; "
         "the figures below are for Q3 only. billing_agent's p95 stays the highest because each invoice needs "
         "a payments-gateway call."),
    Spacer(1, 10),
    table([["Agent", "p50", "p95", "Change from Q2"],
           ["support_agent", "1.9 s", "4.1 s", "-0.3 s"],
           ["triage_agent", "1.2 s", "2.8 s", "0.0 s"],
           ["research_agent", "2.6 s", "5.9 s", "+0.4 s"],
           ["billing_agent", "3.1 s", "7.2 s", "-0.6 s"]]),
    Spacer(1, 12),
    para("Incidents", "Heading2"),
    para("Two incidents affected the registry platform in Q3. INC-2067, from 15 to 22 June, overlapped the "
         "quarter's start only in its follow-up work: the kb-search cache review and dated search results were "
         "completed in July. INC-2093, on 27 August, took the registry down for 42 minutes during a database "
         "failover and is the only incident that counted against availability."),
    para("Follow-up actions from both incidents are complete. The standby lag alert added after INC-2093 has "
         "fired twice since, both times during planned maintenance, and was acknowledged within five minutes."),
    PageBreak(),
    para("Rate limiting", "Heading2"),
    para("Rate-limited requests rose through July and early August, while several internal dashboards shared "
         "keys with agents. They fell after the dashboards moved to their own keys in mid-August."),
    Spacer(1, 10),
    Image(str(OUT / "rate-limited-chart.png"), width=16 * cm, height=7.3 * cm),
    Spacer(1, 12),
    para("Cost", "Heading2"),
    para("Model spend across all agents was within budget for the quarter. billing_agent stayed below its "
         "monthly cap in every month, and no cap raise was requested. The largest single change was "
         "research_agent's lower spend after its migration planning moved test runs to a smaller model."),
])

build("P02-support-tiers.pdf", "Support tiers and response targets", [
    para("Support tiers and response targets", "Title"),
    para("Response targets", "Heading2"),
    para("Every agent's tier sets how quickly the Platform team responds to an incident affecting it, and the "
         "availability the registry commits to for it. Response times are measured from the first page."),
    Spacer(1, 10),
    table([["Tier", "First response", "Resolution target", "Availability commitment"],
           ["standard", "1 hour", "1 business day", "99.5%"],
           ["priority", "15 minutes", "4 hours", "99.9%"]]),
    Spacer(1, 12),
    para("Severity levels", "Heading2"),
    para("Response targets apply to severity 1 and 2 incidents. Severity 3 issues are handled in the normal "
         "ticket queue, whatever the tier."),
    Spacer(1, 10),
    table([["Severity", "Meaning", "Example"],
           ["1", "Agents can't serve users", "Registry unreachable"],
           ["2", "Agents degraded", "Latency alert firing for over 30 minutes"],
           ["3", "No user impact yet", "A dashboard panel not refreshing"]]),
    Spacer(1, 12),
    para("Changing tiers", "Heading2"),
    para("A move to the priority tier needs sign-off from the team's budget holder, as the agent owners' FAQ "
         "describes. The new targets apply from the first incident after the change."),
])

build("P03-oncall-rota-q4.pdf", "On-call rota, Q4 2026", [
    para("On-call rota, Q4 2026", "Title"),
    para("Platform on-call", "Heading2"),
    para("The primary engineer takes every page for the week, starting Monday at 09:00. The secondary is paged "
         "if the primary doesn't acknowledge within 10 minutes, and the escalation manager if neither does "
         "within 20."),
    Spacer(1, 10),
    table([['Week starting', 'Primary', 'Secondary', 'Escalation manager', 'Notes'], ['5 Oct', 'Arjun Mehta', 'Lena Fischer', 'Grace Okafor', ''], ['12 Oct', 'Priya Nair', 'Tomás Reyes', 'Daniel Kim', 'Registry v2.7 release on Wednesday'], ['19 Oct', 'Lena Fischer', 'Arjun Mehta', 'Grace Okafor', ''], ['26 Oct', 'Tomás Reyes', 'Priya Nair', 'Daniel Kim', ''], ['2 Nov', 'Arjun Mehta', 'Lena Fischer', 'Grace Okafor', ''], ['9 Nov', 'Priya Nair', 'Tomás Reyes', 'Daniel Kim', 'Planned registry-db maintenance, Saturday night'], ['16 Nov', 'Lena Fischer', 'Arjun Mehta', 'Grace Okafor', ''], ['23 Nov', 'Tomás Reyes', 'Priya Nair', 'Daniel Kim', ''], ['30 Nov', 'Arjun Mehta', 'Lena Fischer', 'Grace Okafor', ''], ['7 Dec', 'Priya Nair', 'Tomás Reyes', 'Daniel Kim', ''], ['14 Dec', 'Lena Fischer', 'Arjun Mehta', 'Grace Okafor', ''], ['21 Dec', 'Tomás Reyes', 'Priya Nair', 'Daniel Kim', 'Reduced cover: Friday is a company holiday'], ['28 Dec', 'Arjun Mehta', 'Lena Fischer', 'Grace Okafor', 'Reduced cover all week']]),
    Spacer(1, 12),
    para("Swapping a week", "Heading2"),
    para("Swap weeks with another engineer on the rota, then update the paging schedule yourself before the "
         "week starts. A swap isn't in effect until the schedule shows it."),
])

build("P04-architecture-diagram.pdf", "Service dependency diagram", [
    para("Service dependency diagram", "Title"),
    para("How to read it", "Heading2"),
    para("Each arrow points from a service to a service it calls. notification-service was added in September "
         "2026 to send alert emails to agent owners."),
    para("The diagram is generated from the service catalogue every night, so it shows the calls each service "
         "is configured to make, not live traffic. Services with no configured calls appear without arrows."),
    Spacer(1, 10),
    Image(str(OUT / "dependency-diagram.png"), width=16 * cm, height=8.2 * cm),
])
print("built", sorted(p.name for p in OUT.iterdir()))
