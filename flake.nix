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
          # Compact toolchain version to use
          compactVersion = "0.24.0";

          installScript = pkgs.writeShellScript "setup-compact" ''
            set -euo pipefail
            
            # Use project-local compact installation in .nix-bin
            COMPACT_DIR="$PWD/.nix-bin"
            export COMPACT_INSTALL_DIR="$COMPACT_DIR"
            
            # Install compact CLI tool if not present
            if [ ! -x "$COMPACT_DIR/compact" ]; then
              echo "Installing compact developer tools to $COMPACT_DIR..."
              curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | COMPACT_NO_MODIFY_PATH=1 sh
            fi
            
            # Update to specific toolchain version
            "$COMPACT_DIR/compact" update ${compactVersion}
          '';
        in
        {
          default = pkgs.mkShell {
            packages = [ pkgs.curl pkgsUnstable.nodejs pkgs.yarn ];
            shellHook = ''
              ${installScript}
              export PATH="$PWD/.nix-bin:$PATH"
            '';
          };
        }
      );
    };
}
