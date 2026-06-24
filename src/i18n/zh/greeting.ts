const greeting = {
  dow: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
  helloDefault: "你好",
  helloLateNight: "夜深了",
  helloMorning: "早安",
  helloNoon: "午安",
  helloAfternoon: "下午好",
  helloEvening: "晚上好",
  kickerPrefix: "今日 · ",
  kickerFallback: "今日",
  // 主标题：hello = 上面的问候词；name = 站点拥有者名字（getSiteConfig）。中间的「稳住节奏，」是高亮片段。
  headPre: (hello: string, name: string) => `${hello}，${name}。`,
  headAccent: "稳住节奏，",
  headPost: "今天就推进一件大事。",
};

export default greeting;
