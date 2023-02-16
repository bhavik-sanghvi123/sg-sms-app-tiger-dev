# smsAppSG

SG Abbott Deloitte SMS Application for Marketing Cloud Journey Builder with CommzGate

```
https://portal.commzgate.com/downloads/CommzGate_CloudAPI_Guide_v5.1.pdf
```

# installation

two ways to setup your environment, one is ephemeral and the other one is perminant

## Step 1 - installation - the Nix way

to stop polluting your workspace you can install nix and direnv, its a little more involved but results in the same system in the end.

- run the nix installer: https://nixos.org/download.html
- brew install direnv
- add `. /Users/your_home_directory_name_here/.nix-profile/etc/profile.d/nix.sh` to ~/.profile
- add `eval "$(direnv hook bash)"` to ~/.bashrc
- reload shell and cd into directory
- make a copy of `.envrc.local` as `.envrc`
- `direnv allow` when requested
- pat yourself on the back as you have configured a powerful system, review default.nix

it will take a while to run the initial install the first time as it builds up the sources.

## Step 1 - installation - without nix

- install node-12 with homebrew `brew install node@12`
- install yarn with homebrew `brew install yarn`
- cd into directory
- make a copy of `.envrc.local` as `.envrc`
- load the environment variables `source .envrc` (if use_nix throws an error then remove the first line)

## step 2 - build and run

in the directory, run the standard node commands

- install packages with `yarn install`
- run with `yarn start` or `node index.js`
- test with `yarn test`

note: if you chose not to install nix, you will have to load the environment variables, these can be found in .envrc you can load these with `source .envrc`

# Branches

- _master_ - developer code, not stable, but should work
- _testing_ - code that is currently in testing and should be functional (auto deploy)
- _production_ - code that must be functional (auto deploy)

# configuration

environment configurations exist in .envrc.local that need to exist server side
