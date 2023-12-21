import axios from "axios";
import CryptoJS from "crypto-js";
import { xml2json } from "@codask/xml2json";

export const createTag = async (req, res) => {
  const city = "nanterre";
  const enseigne = "BDTEST13";
  const modeCol = "CCC";
  const modeLiv = "LCC";
  // expedition settings
  const expreLangage = "FR";
  const expeAd1 = "MR John Doe";
  const expeAd3 = "Rue des poitier";
  const expeVille = "nanterre";
  const expeCP = "92000";
  const expePays = "FR";
  const expeTell = "+33666666666";
  // destination settings
  const destLangage = "FR";
  const destAd1 = " MME Michelle West";
  const destAd3 = " Rue des choses";
  const destville = "nanterre";
  const destCP = "92000";
  const DestPays = "FR";
  const weigth = "10";
  const nbPackages = "01";
  const CRTValue = "0000070";
  const pays = "FR";
  const privateK = "PrivateK";
  const text = "some";

  const hashString = enseigne + pays + city + privateK;
  const hash = CryptoJS.MD5(hashString)
    .toString(CryptoJS.enc.Hex)
    .toUpperCase();

  const soapString = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <WSI2_CreationEtiquette xmlns="http://www.mondialrelay.fr/webservice/">
          <Enseigne>${enseigne}</Enseigne>
          <ModeCol>${modeCol}</ModeCol>
          <ModeLiv>${modeLiv}</ModeLiv>
          <Expe_Langage>${expreLangage}</Expe_Langage>
          <Expe_Ad1>${expeAd1}</Expe_Ad1>
          <Expe_Ad3>${expeAd3}</Expe_Ad3>
          <Expe_Ville>${expeVille}</Expe_Ville>
          <Expe_CP>${expeCP}</Expe_CP>
          <Expe_Pays>${expePays}</Expe_Pays>
          <Expe_Tel1>${expeTell}</Expe_Tel1>
          <Dest_Langage>${destLangage}</Dest_Langage>
          <Dest_Ad1>${destAd1}</Dest_Ad1>
          <Dest_Ad3>${destAd3}</Dest_Ad3>
          <Dest_Ville>${destville}</Dest_Ville>
          <Dest_CP>${destCP}</Dest_CP>
          <Dest_Pays>${DestPays}</Dest_Pays>
          <Poids>${weigth}</Poids>
          <NbColis>${nbPackages}</NbColis>
          <CRT_Valeur>${CRTValue}</CRT_Valeur>
          <Pays>${pays}</Pays>
          <Ville>${city}</Ville>
          <Security>${hash}</Security>
          <Texte>${text}</Texte>
        </WSI2_CreationEtiquette>
      </soap:Body>
    </soap:Envelope>
  `;

  try {
    const response = await axios.post(
      "https://api.mondialrelay.com/Web_Services.asmx",
      soapString,
      {
        headers: {
          "Content-Type": "text/xml; charssset=utf-8",
          SOAPAction:
            "http://www.mondialrelay.fr/webservice/WSI2_CreationEtiquette",
        },
      }
    );
    res.send({ ok: true, msg: xml2json(`${response.data}`), city: city });
  } catch (error) {
    res
      .status(500)
      .send({ ok: false, msg: "Something went wrong", error: error.message });
  }
};
