export interface ISettingsSection {
    title: string;
    internal_name?: string;
    description?: string;
    options?: ISetting[];
}

export interface ISetting {
    name: string;
    internal_name: string;
    type: "checkbox" | "text" | "password" | "button";
    default?: any;
    description?: string;
    is_password?: boolean;
    onClick?: () => void;
}