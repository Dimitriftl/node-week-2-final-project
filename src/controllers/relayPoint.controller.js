import axios from 'axios'
import CryptoJS from 'crypto-js'
import { xml2json } from '@codask/xml2json'

function formatOpeningHours (hoursArray) {
  if (hoursArray[0] === '0001' && hoursArray[1] === '2359' && hoursArray[2] === '0000' && hoursArray[3] === '0000') return 'h24'
  if (hoursArray[0] === '0000' && hoursArray[1] === '0000' && hoursArray[2] === '0000' && hoursArray[3] === '0000') return 'closed'

  const formatTime = time => {
    const hours = time.substring(0, 2)
    const minutes = time.substring(2)
    return `${hours}h${minutes !== '00' ? `${minutes}` : ''}`
  }
  const openingHours = hoursArray.map(formatTime)
  
  const timeRanges = []
  for (let i = 0; i < openingHours.length; i += 2) {
    const start = openingHours[i]
    const end = openingHours[i + 1]
    if (start !== '0000' || end !== '0000') {
      timeRanges.push(`${start} - ${end}`)
    }
  }
  if (timeRanges[1] === '00h - 00h') return timeRanges[0]
  return timeRanges.join(' | ')
}

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
    const response = await axios.post('https://api.mondialrelay.com/Web_Services.asmx', soapString, { headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: 'http://www.mondialrelay.fr/webservice/WSI3_PointRelais_Recherche' }})
    const jsonResponse = xml2json(`${response.data}`)['soap:Envelope']['soap:Body']['WSI3_PointRelais_RechercheResponse']['WSI3_PointRelais_RechercheResult']['PointsRelais']['PointRelais_Details']
    const msg = jsonResponse.map(item => {
      return {
        id: item.Num,
        name: item.LgAdr1,
        address: `${item.LgAdr3}, ${item.CP}, ${item.Ville}`,
        country: item.Pays,
        location: {
          lat: item.Latitude,
          long: item.Longitude
        },
        openingHours: {
          monday: formatOpeningHours(item.Horaires_Lundi.string),
          tuesday: formatOpeningHours(item.Horaires_Mardi.string),
          wednesday: formatOpeningHours(item.Horaires_Mercredi.string),
          thursday: formatOpeningHours(item.Horaires_Jeudi.string),
          friday: formatOpeningHours(item.Horaires_Vendredi.string),
          saturday: formatOpeningHours(item.Horaires_Samedi.string),
          sunday: formatOpeningHours(item.Horaires_Dimanche.string)
        },
        imageUrl: item.URL_Photo
      }
    })
    res.send({ ok: true, msg, city })
  } catch (error) {
    res.status(500).send({ ok: false, msg: 'Something went wrong', error: error.message })
  }
}