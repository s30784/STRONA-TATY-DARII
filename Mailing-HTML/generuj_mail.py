def generuj_html(paragraphs, image_url, link="#", cta_text=None, cta_link=None):
    """
    Generuje HTML maila w formacie Victoria Dom.
    """

    # Jeśli przekazujesz czysty tekst → łączy akapity
    # Jeśli przekazujesz gotowy HTML → możesz dać jeden element w liście
    body_html = "<br><br>".join(paragraphs)

    # CTA button (wersja tabelowa – bezpieczna dla Outlooka)
    cta_html = ""
    if cta_text and cta_link:
        cta_html = f"""
        <tr>
          <td align="center" style="padding-top: 16px;">
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" bgcolor="#f50000" style="border-radius:100px;">
                  <a href="{cta_link}"
                     target="_blank"
                     style="display:inline-block;
                            padding:22px 36px;
                            font-family:sans-serif;
                            font-size:14px;
                            font-weight:700;
                            color:#ffffff;
                            text-decoration:none;
                            text-transform:uppercase;">
                    {cta_text}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        """

    html = f"""
    <html>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      </head>
      <body>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr style="background-color: #ffffff;">
            <td align="center" valign="top">
              <table border="0" cellpadding="0" cellspacing="0" width="570">
                
                <!-- TEKST -->
                <tr>
                  <td align="center" style="text-align: center; color: #000000; padding-top:30px;">
                    <p style="font-size:15px;
                              line-height:1.5;
                              font-weight:500;
                              font-family:sans-serif;
                              margin:0;">
                      {body_html}
                    </p>
                  </td>
                </tr>

                <!-- CTA -->
                {cta_html}

                <!-- OBRAZ -->
                <tr>
                  <td align="center" style="padding-top:20px;">
                    <a href="{link}" target="_blank">
                      <img src="{image_url}"
                           alt="Mail image"
                           style="max-width:100%; height:auto; display:block;" />
                    </a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """

    return html
