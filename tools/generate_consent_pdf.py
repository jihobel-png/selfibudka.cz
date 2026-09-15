from pathlib import Path

from reportlab.graphics import renderSVG
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Flowable,
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "output/pdf/souhlas-se-zverejnenim-fotografie-selfibudka.pdf"
QR_PATH = ROOT / "assets/brand/qr-souhlas-fotografie.svg"
LOGO_PATH = ROOT / "assets/brand/selfibudka-logo.png"
FORM_URL = "https://selfibudka.cz/souhlas-se-zverejnenim-fotografie"
PRIVACY_URL = "https://selfibudka.cz/ochrana-osobnich-udaju"

INK = colors.HexColor("#1F1F1F")
MUTED = colors.HexColor("#4A4A4A")
PAPER = colors.HexColor("#F8F7F4")
CORAL = colors.HexColor("#FF6B6B")
SAGE_LIGHT = colors.HexColor("#DFE8DC")
LINE = colors.HexColor("#D8D6D1")


def register_fonts():
    # ReportLab neumí CFF křivky v dodaných Montserrat OTF. Noto Sans zachová
    # českou diakritiku a velmi podobnou čistou geometrii sazby v PDF.
    font_dir = Path("/Users/jirihobel/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype")
    pdfmetrics.registerFont(TTFont("Montserrat", str(font_dir / "NotoSans-Regular.ttf")))
    pdfmetrics.registerFont(TTFont("Montserrat-SemiBold", str(font_dir / "NotoSans-Bold.ttf")))
    pdfmetrics.registerFont(TTFont("Montserrat-Bold", str(font_dir / "NotoSans-Bold.ttf")))


def qr_drawing(value: str, size: float) -> Drawing:
    qr = QrCodeWidget(value)
    x1, y1, x2, y2 = qr.getBounds()
    width = x2 - x1
    height = y2 - y1
    scale = min(size / width, size / height)
    drawing = Drawing(size, size, transform=[scale, 0, 0, scale, -x1 * scale, -y1 * scale])
    drawing.add(qr)
    return drawing


class CheckboxLine(Flowable):
    def __init__(self, text: str, font_name="Montserrat", font_size=9.2, leading=13):
        super().__init__()
        self.text = text
        self.font_name = font_name
        self.font_size = font_size
        self.leading = leading
        self.height = leading + 3

    def draw(self):
        self.canv.setStrokeColor(INK)
        self.canv.setLineWidth(0.8)
        self.canv.rect(0, 3.2, 8.5, 8.5, fill=0, stroke=1)
        self.canv.setFillColor(INK)
        self.canv.setFont(self.font_name, self.font_size)
        self.canv.drawString(15, 4.1, self.text)


def page_decor(canvas, doc):
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.6)
    canvas.line(22 * mm, 18 * mm, width - 22 * mm, 18 * mm)
    canvas.setFillColor(MUTED)
    canvas.setFont("Montserrat", 6.7)
    canvas.drawString(22 * mm, 11.5 * mm, "Praktický vzor - před prvním použitím doporučujeme právní kontrolu.")
    canvas.drawRightString(width - 22 * mm, 11.5 * mm, f"Selfíbudka.cz  |  {doc.page}")
    canvas.restoreState()


def field_cell(label: str, note: str = ""):
    suffix = f"<br/><font size='6.8' color='#686868'>{note}</font>" if note else ""
    return Paragraph(f"<b>{label}</b>{suffix}<br/>________________________________________", STYLES["field"])


def logo_image():
    logo = Image(str(LOGO_PATH), width=65 * mm, height=22 * mm)
    logo.hAlign = "LEFT"
    return logo


register_fonts()
base = getSampleStyleSheet()
STYLES = {
    "title": ParagraphStyle("title", parent=base["Title"], fontName="Montserrat-Bold", fontSize=22, leading=25, textColor=INK, spaceAfter=4),
    "subtitle": ParagraphStyle("subtitle", parent=base["BodyText"], fontName="Montserrat", fontSize=9.4, leading=12.5, textColor=MUTED, spaceAfter=10),
    "section": ParagraphStyle("section", parent=base["Heading2"], fontName="Montserrat-Bold", fontSize=10.4, leading=12.5, textColor=CORAL, spaceBefore=7, spaceAfter=4),
    "body": ParagraphStyle("body", parent=base["BodyText"], fontName="Montserrat", fontSize=7.45, leading=10.2, textColor=MUTED, spaceAfter=4),
    "body_small": ParagraphStyle("body_small", parent=base["BodyText"], fontName="Montserrat", fontSize=6.65, leading=8.5, textColor=MUTED, spaceAfter=3),
    "field": ParagraphStyle("field", parent=base["BodyText"], fontName="Montserrat", fontSize=7.5, leading=9.2, textColor=INK),
    "center": ParagraphStyle("center", parent=base["BodyText"], fontName="Montserrat", fontSize=10, leading=14, alignment=TA_CENTER, textColor=MUTED),
    "qr_title": ParagraphStyle("qr_title", parent=base["Title"], fontName="Montserrat-Bold", fontSize=29, leading=32, alignment=TA_CENTER, textColor=INK, spaceAfter=10),
}


def build_pdf():
    PDF_PATH.parent.mkdir(parents=True, exist_ok=True)
    QR_PATH.parent.mkdir(parents=True, exist_ok=True)

    renderSVG.drawToFile(qr_drawing(FORM_URL, 220), str(QR_PATH))
    qr_svg = QR_PATH.read_text(encoding="utf-8")
    qr_svg = qr_svg.replace("<title>...</title>", "<title>QR kód pro souhlas se zveřejněním fotografie</title>")
    qr_svg = qr_svg.replace("<desc>...</desc>", f"<desc>Odkaz na {FORM_URL}</desc>")
    QR_PATH.write_text(qr_svg, encoding="utf-8")

    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=A4,
        rightMargin=22 * mm,
        leftMargin=22 * mm,
        topMargin=18 * mm,
        bottomMargin=24 * mm,
        title="Souhlas se zveřejněním fotografie - Selfíbudka.cz",
        author="Selfíbudka.cz",
        subject="Dobrovolné svolení se zveřejněním vybrané fotografie",
    )

    story = [
        logo_image(),
        Spacer(1, 5 * mm),
        Paragraph("Souhlas se zveřejněním fotografie", STYLES["title"]),
        Paragraph("Dobrovolné svolení pro konkrétní fotografii a vybrané propagační kanály", STYLES["subtitle"]),
    ]

    controller = Table(
        [[Paragraph("<b>Správce:</b> Jan Hobel, IČO 19077599, Na Palcátech 621, 331 41 Kralovice<br/>info@selfibudka.cz  |  +420 721 655 200", STYLES["body"])]],
        colWidths=[166 * mm],
    )
    controller.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SAGE_LIGHT),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#A8BFA3")),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story += [controller, Spacer(1, 5)]

    story += [
        Paragraph("1. Osoba udělující svolení", STYLES["section"]),
        Table(
            [[field_cell("Jméno a příjmení"), field_cell("E-mail")],
             [field_cell("Jméno nezletilé osoby", "Vyplní zákonný zástupce."), field_cell("Vztah k nezletilé osobě")]],
            colWidths=[81 * mm, 81 * mm],
            style=TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]),
        ),
        Spacer(1, 4),
        Paragraph("Zaškrtněte právě jednu možnost:", STYLES["body_small"]),
        CheckboxLine("Jsem osoba zachycená na fotografii."),
        CheckboxLine("Jsem zákonný zástupce oprávněný/á udělit svolení za uvedenou nezletilou osobu."),

        Paragraph("2. Identifikace fotografie", STYLES["section"]),
        Table(
            [[field_cell("Název nebo místo akce"), field_cell("Datum akce")],
             [field_cell("Označení fotografie", "Číslo snímku, název souboru nebo odkaz."), field_cell("Osoba na fotografii")]],
            colWidths=[81 * mm, 81 * mm],
            style=TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]),
        ),
        Paragraph("U skupinové fotografie je potřeba samostatné svolení všech rozpoznatelných osob.", STYLES["body_small"]),

        Paragraph("3. Povolené kanály", STYLES["section"]),
        Paragraph("Zaškrtněte alespoň jednu možnost:", STYLES["body_small"]),
        CheckboxLine("Web selfibudka.cz"),
        CheckboxLine("Instagram @selfibudka.cz"),
        CheckboxLine("Facebook Selfíbudka.cz"),

        Paragraph("4. Rozsah svolení", STYLES["section"]),
        Paragraph(
            "Dobrovolně a bezplatně dovoluji správci zveřejnit výše označenou fotografii, na které jsem rozpoznatelný/á nebo na které je rozpoznatelná mnou zastupovaná nezletilá osoba, za účelem prezentace a propagace služby Selfíbudka.cz pouze na označených kanálech. Uděluji svolení k rozšiřování podoby podle § 85 občanského zákoníku a zároveň souhlas se zpracováním fotografie jako osobního údaje podle čl. 6 odst. 1 písm. a) GDPR. Svolení zahrnuje přiměřené technické úpravy, například ořez, změnu velikosti nebo barevnosti. Nezahrnuje placenou reklamu, prodej fotografie, propagaci jiné značky ani použití na jiném než označeném kanálu.",
            STYLES["body"],
        ),
        Paragraph(
            "Svolení platí 5 let od udělení, nejdéle do odvolání, a není podmínkou služby. Mohu je kdykoli odvolat na info@selfibudka.cz; odvolání působí do budoucna a správce odstraní obsah z kanálů, které ovládá, bez zbytečného odkladu. U Instagramu a Facebooku bude fotografie zpřístupněna společnosti Meta Platforms Ireland Limited a zpracována podle jejích vlastních zásad, včetně tam popsaných mezinárodních přenosů. Uživatelé mohou obsah dále sdílet či stáhnout.",
            STYLES["body"],
        ),
        Paragraph(f"Verze: SB-FOTO-2026-09-15-01  |  Informace: {PRIVACY_URL}  |  Meta: https://www.facebook.com/privacy/policy/", STYLES["body_small"]),
        Spacer(1, 5),
        KeepTogether([
            CheckboxLine("Souhlasím s uvedeným rozsahem zveřejnění."),
            Spacer(1, 7),
            Table(
                [[field_cell("Místo a datum"), field_cell("Podpis osoby / zákonného zástupce")]],
                colWidths=[81 * mm, 81 * mm],
                style=TableStyle([
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
                    ("LEFTPADDING", (0, 0), (-1, -1), 7),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]),
            ),
        ]),

        PageBreak(),
        logo_image(),
        Spacer(1, 12 * mm),
        Paragraph("Souhlas zvládnete i online", STYLES["qr_title"]),
        Paragraph("Naskenujte QR kód, označte konkrétní fotografii a vyberte kanály, na kterých ji Selfíbudka smí zveřejnit.", STYLES["center"]),
        Spacer(1, 8 * mm),
        Table([[qr_drawing(FORM_URL, 82 * mm)]], colWidths=[166 * mm], style=TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("BACKGROUND", (0, 0), (-1, -1), colors.white),
            ("BOX", (0, 0), (-1, -1), 0.7, LINE),
            ("LEFTPADDING", (0, 0), (-1, -1), 10 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10 * mm),
            ("TOPPADDING", (0, 0), (-1, -1), 10 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10 * mm),
        ])),
        Spacer(1, 7 * mm),
        Paragraph(FORM_URL, ParagraphStyle("url", parent=STYLES["center"], fontName="Montserrat-SemiBold", fontSize=8.4, textColor=INK)),
        Spacer(1, 9 * mm),
        Table(
            [[Paragraph("<b>Souhlas je dobrovolný.</b><br/>Není podmínkou focení ani využití služby Selfíbudka.cz.", STYLES["body"]),
              Paragraph("<b>Každý rozhoduje sám.</b><br/>Za nezletilou osobu souhlas uděluje zákonný zástupce.", STYLES["body"])]],
            colWidths=[81 * mm, 81 * mm],
            style=TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), SAGE_LIGHT),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#A8BFA3")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#A8BFA3")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ]),
        ),
        Spacer(1, 7 * mm),
        Paragraph("Souhlas můžete kdykoli odvolat na info@selfibudka.cz.", ParagraphStyle("withdraw", parent=STYLES["center"], fontName="Montserrat-Bold", fontSize=10.5, textColor=CORAL)),
    ]

    doc.build(story, onFirstPage=page_decor, onLaterPages=page_decor)


if __name__ == "__main__":
    build_pdf()
    print(PDF_PATH)
    print(QR_PATH)
