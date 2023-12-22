import axios from "axios";
// import Tag from "../models/package.model.js";
import CryptoJS from "crypto-js";
import { xml2json } from "@codask/xml2json";

export const createTag = async (req, res) => {
  const enseigne = "BDTEST13";
  const modeCol = "CCC";
  const modeLiv = "LCC";
  // Expedition settings
  const expreLangage = "FR";
  const expeAd1 = "MR DE LA ROCHE";
  const expeAd3 = "252 AVENUE DE DUNKERQUE";
  const expeVille = "LILLE";
  const expeCP = "59160";
  const expePays = "FR";
  const expeTell = "+33123456789";
  // Destination settings
  const destLangage = "FR";
  const destAd1 = "MR DE LA ROCHE";
  const destAd3 = "2 RUE MAX LINDER";
  const destville = "NANTES";
  const destCP = "44100";
  const DestPays = "FR";
  const DestTel1 = "+33201234568";
  const weigth = "100";
  const nbPackages = "1";
  const CRTValue = "0";
  const COLRelPays = "FR";
  const COLRel = "324234";
  const LIVRelPays = "FR";
  const LIVRel = "324234";
  const privateK = "PrivateK";
  const text = "SOME";

  const variablesSansEspaces = Object.values({
    enseigne,
    modeCol,
    modeLiv,
    expreLangage,
    expeAd1,
    expeAd3,
    expeVille,
    expeCP,
    expePays,
    expeTell,
    destLangage,
    destAd1,
    destAd3,
    destville,
    destCP,
    DestPays,
    DestTel1,
    weigth,
    nbPackages,
    CRTValue,
    COLRelPays,
    COLRel,
    LIVRelPays,
    LIVRel,
    privateK,
  }).map((variable) => variable.replace(/\s/g, ""));

  const hashStringWithoutSpaces = variablesSansEspaces.join("");

  const hash = CryptoJS.MD5(hashStringWithoutSpaces)
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
          <Dest_Tel1>${DestTel1}</Dest_Tel1>
          <Poids>${weigth}</Poids>
          <NbColis>${nbPackages}</NbColis>
          <CRT_Valeur>${CRTValue}</CRT_Valeur>
          <COL_Rel_Pays>${COLRelPays}</COL_Rel_Pays>
          <COL_Rel>${COLRel}</COL_Rel>
          <LIV_Rel_Pays>${LIVRelPays}</LIV_Rel_Pays>
          <LIV_Rel>${LIVRel}</LIV_Rel>
          <Security>4116E63C8D2DF39268D7FFA0051235C7</Security>
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
    // const newTag = await Tag.create(req.body);
    // res.send({ ok: true, data: newTag, msg: "New tag created" });
    // res.send({ ok: true, data: newTag, msg: "New tag created" });

    res.send({ ok: true, msg: xml2json(`${response.data}`) });
  } catch (error) {
    res
      .status(500)
      .send({ ok: false, msg: "Something went wrong", error: error.message });
  }
};
