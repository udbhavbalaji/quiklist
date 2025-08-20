import createLogify from "@udawg00/logify";

export default createLogify({
  level:
    process.env.NODE_ENV && process.env.NODE_ENV === "production"
      ? "info"
      : "debug",
  withTime: false,
  context: "ql::",
  showLevel: false,
});
