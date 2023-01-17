export function filepathJoin(input: string[]) {
    let paths = input
        .filter((path) => !!path) // Remove undefined | null | empty
        .join("/") //Join to string
        .replaceAll("\\", "/") // Replace from \ to /
        .split("/")
        .filter((path) => !!path && path !== ".") // Remove empty in case a//b///c or ./a ./b
        .reduce(
            (items, item) => {
                //@ts-ignore
                item === ".." ? items.pop() : items.push(item);
                return items
            },
            []
        ) // Jump one levep if ../  
        ;

    //@ts-ignore
    if (input[0] && input[0].startsWith('/')) paths.unshift("")

    return paths.join("/") || (paths.length ? "/" : ".");
}

