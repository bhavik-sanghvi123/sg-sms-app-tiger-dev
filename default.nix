with import <nixpkgs> {};
let
  in stdenv.mkDerivation rec {
    name = "env";
    env = buildEnv {
      name = name;
      paths = buildInputs;
    };
    buildInputs = [
      bashInteractive
      heroku
      nodejs-12_x
      yarn
    ];
}
