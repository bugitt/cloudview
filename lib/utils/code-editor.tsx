import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-yaml";

interface CodeEditorProps {
    language: string
    value?: string
    theme?: string
    height: string
    fontsize?: number
    onChange?: (value: string, event?: any) => void
}

const CodeEditor = (props: CodeEditorProps) => (
    <div>
        <AceEditor
            mode={props.language}
            theme={props.theme ? props.theme : 'github'}
            onChange={props.onChange}
            value={props.value}
            name="UNIQUE_ID_OF_DIV"
            editorProps={{
                $blockScrolling: true
            }}
            fontSize={props.fontsize ? props.fontsize : 14}
            height={props.height}
            width='100%'
        />
    </div>
)

export default CodeEditor