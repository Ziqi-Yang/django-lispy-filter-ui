{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flakelight.url = "github:nix-community/flakelight";
  };
  outputs = { flakelight, ... }@inputs:
    flakelight ./. {
      inherit inputs;
      devShell.packages = pkgs: with pkgs; [
        (python3.withPackages (ppkgs: with ppkgs; [
          pip
        ]))
        expect # contains `unbuffer` command
      ];
    };
}
