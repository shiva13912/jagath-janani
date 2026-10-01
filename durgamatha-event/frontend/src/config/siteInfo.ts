// The organisation's own words and contact details, in ONE place.
// Replace the text below with your real details. Any contact field left as '' is
// simply not shown on the website (nothing is made up).
export const siteInfo = {
  shortName: 'Durgamatha',
  name: 'Durgamatha Events',
  tagline: 'Celebrating our festivals and events together.',
  intro:
    'Follow the events of Durgamatha in one place: find out what is coming up, and relive past celebrations through their photos and videos.',
  // Paragraphs of the About page and the "About us" section of the home page
  about: [
    'Durgamatha Events brings our community together for festivals, cultural programmes and celebrations.',
    'This website is where we share upcoming events, and where everyone can browse the photo and video albums of past events.',
  ],
  contact: {
    email: '', // e.g. 'info@example.org'
    phone: '', // e.g. '+91 98765 43210'
    address: '', // e.g. 'Temple Street, Hyderabad'
    hours: '', // e.g. 'Every day, 6 AM to 9 PM'
  },
}

export function hasContactDetails(): boolean {
  return Object.values(siteInfo.contact).some((value) => value.trim() !== '')
}
