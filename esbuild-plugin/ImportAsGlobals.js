export function importAsGlobals(mapping) {
  // https://stackoverflow.com/a/3561711/153718
  const escRe = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  const filter = new RegExp(
      Object.keys(mapping)
          .map((mod) => `^${escRe(mod)}$`)
          .join("|"),
  );

  return {
      name: "global-imports",
      setup(build) {
          build.onResolve({ filter }, (args) => {
              if (!mapping[args.path]) {
                  throw new Error(`Unknown global: ${args.path}`);
              }
              return {
                  path: args.path,
                  namespace: "external-global",
              };
          });

          build.onLoad(
              {
                  filter,
                  namespace: "external-global",
              },
              async (args) => {
                  const global = mapping[args.path];
                  return {
                      contents: `module.exports = ${global};`,
                      loader: "js",
                  };
              },
          );
      },
  };
}
