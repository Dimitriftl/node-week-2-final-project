import axios from 'axios'
import CryptoJS from 'crypto-js'
import { xml2json } from '@codask/xml2json'

export const findRelay = async (req, res) => {
  const city = req.query.city
  const enseigne = 'BDTEST13'
  const pays = 'FR'
  const privateK = 'PrivateK'
  const hashString = enseigne + pays + city + privateK
  const hash = CryptoJS.MD5(hashString).toString(CryptoJS.enc.Hex).toUpperCase()
  const soapString = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <WSI3_PointRelais_Recherche xmlns="http://www.mondialrelay.fr/webservice/">
        <Enseigne>${enseigne}</Enseigne>
        <Pays>${pays}</Pays>
        <Ville>${city}</Ville>
        <Security>${hash}</Security>
        </WSI3_PointRelais_Recherche>
      </soap:Body>
    </soap:Envelope>
  `

  try {
    const response = await axios.post('https://api.mondialrelay.com/Web_Services.asmx', soapString, { headers: { 'Content-Type': 'text/xml; charssset=utf-8', SOAPAction: 'http://www.mondialrelay.fr/webservice/WSI3_PointRelais_Recherche' }})
    res.send({ ok: true, msg: xml2json(`${response.data}`), city: city })
  } catch (error) {
    res.status(500).send({ ok: false, msg: 'Something went wrong', error: error.message })
  }
}