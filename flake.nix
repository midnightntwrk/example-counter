{
  description = "Example Counter – Nix flake that provides the Compact compiler per system";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    nixpkgs-unstable.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs = inputs:
    let
      supportedSystems = [
        "x86_64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forEachSupportedSystem = f:
        inputs.nixpkgs.lib.genAttrs supportedSystems (
          system:
            f {
              pkgs = import inputs.nixpkgs { inherit system; };
              pkgsUnstable = import inputs."nixpkgs-unstable" { inherit system; };
              inherit system;
            }
        );
    in
    {
      devShells = forEachSupportedSystem ({ pkgs, pkgsUnstable, system }:
        let
          # Compact compiler release to use
          compactVersion = "0.24.0";

          # Artifact URLs by host system
          urlForSystem = {
            "x86_64-linux" = "https://d3fazakqrumx6p.cloudfront.net/artifacts/compiler/compactc_${compactVersion}/compactc_v${compactVersion}_x86_64-unknown-linux-musl.zip";
            "x86_64-darwin" = "https://d3fazakqrumx6p.cloudfront.net/artifacts/compiler/compactc_${compactVersion}/compactc_v${compactVersion}_x86_64-apple-darwin.zip";
            "aarch64-darwin" = "https://d3fazakqrumx6p.cloudfront.net/artifacts/compiler/compactc_${compactVersion}/compactc_v${compactVersion}_aarch64-darwin.zip";
          };

          # Local bin dir for downloaded tools
          binDir = ".nix-bin";

          installScript = pkgs.writeShellScript "setup-compactc" ''
            set -euo pipefail
            mkdir -p ${binDir}
            
            if [ ! -x ${binDir}/compactc ] || [ "$(cat ${binDir}/.compactc-version 2>/dev/null || echo)" != "${compactVersion}" ]; then
              tmp="$(mktemp -d)"
              trap 'rm -rf "$tmp"' EXIT
              curl -fsSL "${urlForSystem.${system}}" -o "$tmp/compactc.zip"
              unzip -q "$tmp/compactc.zip" -d "$tmp"
              cp "$tmp"/* ${binDir}/
              chmod +x ${binDir}/*
              echo "${compactVersion}" > ${binDir}/.compactc-version
            fi
          '';
        in
        {
          default = pkgs.mkShell {
            packages = [ pkgs.curl pkgs.unzip pkgsUnstable.nodejs pkgs.yarn ];
            shellHook = ''
              ${installScript}
              export PATH="$PWD/${binDir}:$PATH"
              export ZKIR_BIN="$PWD/${binDir}/zkir"
            '';
          };
        }
      );
    };
}
