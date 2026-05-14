# app.py
from flask import Flask, request, render_template_string, send_file
from generuj_mail import generuj_html
from io import BytesIO
import base64
import tempfile

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = tempfile.gettempdir()

FORM = """
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Generator maili</title>

  <!-- Quill CSS -->
  <link href="https://cdn.quilljs.com/1.3.7/quill.snow.css" rel="stylesheet">

  <!-- Quill JS -->
  <script src="https://cdn.quilljs.com/1.3.7/quill.js"></script>

  <style>
    #editor {
      height: 350px;
      background-color: #fff;
    }
  </style>
</head>
<body>

<h2>Wgraj grafikę i wpisz treść</h2>

<form id="mailForm" method="post" enctype="multipart/form-data">
  <label>Grafika (jpg/png):
    <input type="file" name="image" required>
  </label>
  <br><br>

  <label>Link pod zdjęciem:
    <input type="text" name="link" value="#">
  </label>
  <br><br>

  <label>CTA tekst:
    <input type="text" name="cta_text">
  </label>

  <label>CTA link:
    <input type="text" name="cta_link">
  </label>
  <br><br>

  <label>Treść maila:</label><br>
  <!-- Quill editor container -->
  <div id="editor"></div>
  <!-- Hidden input to store HTML content -->
  <input type="hidden" name="body">
  <br><br>

  <button type="submit">Generuj HTML</button>
</form>

<script>
  // Inicjalizacja Quill
  var quill = new Quill('#editor', {
    theme: 'snow',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image']
      ]
    }
  });

  // Przed wysłaniem formularza ustawiamy HTML w hidden input
  document.getElementById('mailForm').onsubmit = function() {
    var html = quill.root.innerHTML;
    document.querySelector('input[name=body]').value = html;
  };
</script>

</body>
</html>
"""

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":

        # ====== OBRAZ ======
        f = request.files.get("image")
        if not f:
            return "Brak pliku", 400

        img_bytes = f.read()
        encoded_img = base64.b64encode(img_bytes).decode("utf-8")
        mime_type = f.mimetype
        image_url = f"data:{mime_type};base64,{encoded_img}"

        # ====== TREŚĆ (GOTOWY HTML Z EDYTORA) ======
        body_html = request.form.get("body", "")

        # ====== CTA I LINK ======
        cta_text = request.form.get("cta_text") or None
        cta_link = request.form.get("cta_link") or None
        link = request.form.get("link", "#")

        # ====== GENEROWANIE ======
        html = generuj_html(
            paragraphs=[body_html],  # przekazujemy jako jeden blok HTML
            image_url=image_url,
            link=link,
            cta_text=cta_text,
            cta_link=cta_link
        )

        buf = BytesIO(html.encode("utf-8"))
        return send_file(
            buf,
            as_attachment=True,
            download_name="mail_generated.html",
            mimetype="text/html"
        )

    return render_template_string(FORM)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
