module Curves
{
    export interface Tool
    {
        attach(container: HTMLElement): void;
        detach(): void;
        name(): string;
    }
}