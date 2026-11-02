/** argv without the "--" separator some package managers forward. */
export const cliArgv = (): string[] => process.argv.slice(2).filter((a) => a !== "--");
