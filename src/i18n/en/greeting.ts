const greeting = {
  dow: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  helloDefault: "Hello",
  helloLateNight: "Burning the midnight oil",
  helloMorning: "Good morning",
  helloNoon: "Good afternoon",
  helloAfternoon: "Good afternoon",
  helloEvening: "Good evening",
  kickerPrefix: "Today · ",
  kickerFallback: "Today",
  // Main heading: hello = greeting word above; name = the site owner's name (getSiteConfig). "Keep your rhythm," is the accent fragment.
  headPre: (hello: string, name: string) => `${hello}, ${name}. `,
  headAccent: "Keep your rhythm,",
  headPost: " and push one big thing forward today.",
};

export default greeting;
