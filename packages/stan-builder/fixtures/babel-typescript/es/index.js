import _objectWithoutProperties from "@babel/runtime/helpers/esm/objectWithoutProperties";
export default function (args) {
  var _args$name;

  var name = args.name,
      o = _objectWithoutProperties(args, ["name"]);

  console.log(o);
  return (_args$name = args === null || args === void 0 ? void 0 : args.name) !== null && _args$name !== void 0 ? _args$name : 'stan';
}
//# sourceMappingURL=index.js.map
