import axios from 'axios'
import CryptoJS from 'crypto-js'

export const findRelay = async (req, res) => {
  const city = req.query.city
  const enseigne = 'BDTEST13'
  const pays = 'FR'
  const privateK = 'PrivateK'
  const hashString = enseigne + pays + city + privateK
  const hash = CryptoJS.MD5(hashString).toString(CryptoJS.enc.Hex).toUpperCase()
  const soapString = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><WSI2_RecherchePointRelais xmlns="http://www.mondialrelay.fr/webservice/"><Enseigne>${enseigne}Y</Enseigne><Pays>${pays}</Paysh><Ville>${city}</Ville><Security>${hash}</Security></WSI2_RecherchePointRelais></soap:Body></soap:Envelope>`

  const response = await axios.post('https://api.mondialrelay.com/Web_Services.asmx/WSI2_PointRelais', soapString, { headers: { "Content-Type": "text/xml; charset=utf-8" } })

  try {
    res.send({ ok: true, msg: response.data, city: city })
  } catch (error) {
    console.error(error.message)
    res.status(500).send({
      ok: false,
      msg: 'Something went wrong',
      error: error.message
    })
  }

}