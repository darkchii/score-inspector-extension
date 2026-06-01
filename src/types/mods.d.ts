export interface IRulesetModData {
    name: string;
    rulesetId: number;
    mods: IMod[];
}

export interface IMod {
    Acronym: string;
    Name: string;
    Description: string;
    Type: string;
    Settings: IModSetting[];
    IncompatibleMods: string[];
    RequiresConfiguration: boolean;
    UserPlayable: boolean;
    ValidForMultiplayer: boolean;
    ValidForFreestyleAsRequiredMod: boolean;
    ValidForMultiplayerAsFreeMod: boolean;
    AlwaysValidForSubmission: boolean;
}

export interface IModSetting {
    Name: string;
    Type: string;
    Label: string;
    Description: string;

    [key: string]: any;
}
