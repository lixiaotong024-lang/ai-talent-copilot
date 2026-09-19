declare module 'mammoth/mammoth.browser' {
  export interface ExtractResult {
    value: string
    messages: unknown[]
  }

  interface Mammoth {
    extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<ExtractResult>
    convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<ExtractResult>
  }

  const mammoth: Mammoth
  export default mammoth
}
