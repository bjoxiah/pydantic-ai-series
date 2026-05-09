export type ConfirmedPages = {
    name: string
    description: string
}

export type GeneratedPages = {
    name: string
    description: string
    html: string
}

export type SharedState = {
    project_name: string
    confirmed_pages: ConfirmedPages[]
    generated_pages: GeneratedPages[]
}