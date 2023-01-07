import { ProForm, ProFormInstance, ProFormSelect, ProFormSwitch, ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { Button, Drawer } from "antd";
import { useRef, useState } from "react";
import { PostProjectProjectIdReposRequest, Project } from "../../../cloudapi-client";
import { cloudapiClient } from "../../../utils/cloudapi";
import { messageInfo, notificationError } from "../../../utils/notification";
import { formItemProjectNameValidator, projectNameExtraInfo } from "../../../utils/project";

interface AddGitRepoFormProps {
    project: Project
    hook(): void
}

interface CreateGitRepoFormDataType {
    name: string
    description: string
    public: boolean
    gitignores: string
    license: string
}

export function AddGitRepoForm(props: AddGitRepoFormProps) {
    const formRef = useRef<ProFormInstance>()
    const [open, setOpen] = useState(false);

    const { project, hook } = props

    const showDrawer = () => {
        setOpen(true);
    };

    const onClose = () => {
        setOpen(false);
    };

    const onFinish = async (values: CreateGitRepoFormDataType) => {
        const req: PostProjectProjectIdReposRequest = {
            name: values.name,
            description: values.description,
            private: !values.public,
            gitignores: values.gitignores,
            license: values.license,
        }
        try {
            await cloudapiClient.postProjectProjectIdRepos(String(project.id), req)
            messageInfo('创建代码仓库成功')
            await hook()
            formRef.current?.resetFields()
            onClose()
            return true
        } catch (err) {
            notificationError('创建代码仓库失败')
            return false
        }
    }

    formRef.current?.setFieldValue('public', true)
    formRef.current?.setFieldValue('readme', true)

    return (
        <>
            <Button type="primary" onClick={showDrawer}>
                添加代码仓库
            </Button>
            <Drawer title="添加代码仓库" placement="right" onClose={onClose} open={open}>
                <ProForm<CreateGitRepoFormDataType>
                    formRef={formRef}
                    name="create_git_repo"
                    layout="vertical"
                    onFinish={onFinish}
                >
                    <ProFormText
                        name="name"
                        label="代码仓库名称"
                        extra={[projectNameExtraInfo]}
                        rules={[
                            { required: true, message: '请输入合法的代码仓库名称' },
                            {
                                type: 'string',
                                validator: (_, value) =>
                                    formItemProjectNameValidator(value)
                            },
                            {
                                type: 'string',
                                validator: (_, value) => {
                                    return cloudapiClient.getReposNameExist(value).then((res) => {
                                        if (res.data) {
                                            return Promise.reject('代码仓库名称已存在')
                                        }
                                        return Promise.resolve()
                                    }).catch((err) => {
                                        return Promise.reject('代码仓库名称已存在')
                                    })
                                }
                            }
                        ]}
                    />
                    <ProFormSwitch label="代码仓库是否公开可见" name="public" />
                    <ProFormTextArea label="代码仓库描述" name="description" />
                    <ProFormSelect name="gitignores" label=".gitignore 模板" valueEnum={gitIgnoresOptionsObject} showSearch />
                    <ProFormSelect name="license" label="选择许可证" valueEnum={licenseOptionsObject} showSearch />
                </ProForm>
            </Drawer>
        </>
    );
}

const licenseOptionsObject = {
    "Abstyles License": "Abstyles License",
    "Academic Free License v1.1": "Academic Free License v1.1",
    "Academic Free License v1.2": "Academic Free License v1.2",
    "Academic Free License v2.0": "Academic Free License v2.0",
    "Academic Free License v2.1": "Academic Free License v2.1",
    "Academic Free License v3.0": "Academic Free License v3.0",
    "Affero General Public License v1.0": "Affero General Public License v1.0",
    "Apache License 1.0": "Apache License 1.0",
    "Apache License 1.1": "Apache License 1.1",
    "Apache License 2.0": "Apache License 2.0",
    "Artistic License 1.0": "Artistic License 1.0",
    "Artistic License 2.0": "Artistic License 2.0",
    "BSD 2-clause License": "BSD 2-clause License",
    "BSD 3-clause License": "BSD 3-clause License",
    "BSD 4-clause License": "BSD 4-clause License",
    "Creative Commons CC0 1.0 Universal": "Creative Commons CC0 1.0 Universal",
    "Eclipse Public License 1.0": "Eclipse Public License 1.0",
    "Educational Community License v1.0": "Educational Community License v1.0",
    "Educational Community License v2.0": "Educational Community License v2.0",
    "GNU Affero General Public License v3.0": "GNU Affero General Public License v3.0",
    "GNU Free Documentation License v1.1": "GNU Free Documentation License v1.1",
    "GNU Free Documentation License v1.2": "GNU Free Documentation License v1.2",
    "GNU Free Documentation License v1.3": "GNU Free Documentation License v1.3",
    "GNU General Public License v1.0": "GNU General Public License v1.0",
    "GNU General Public License v2.0": "GNU General Public License v2.0",
    "GNU General Public License v3.0": "GNU General Public License v3.0",
    "GNU Lesser General Public License v2.1": "GNU Lesser General Public License v2.1",
    "GNU Lesser General Public License v3.0": "GNU Lesser General Public License v3.0",
    "GNU Library General Public License v2.0": "GNU Library General Public License v2.0",
    "ISC license": "ISC license",
    "MIT License": "MIT License",
    "Mozilla Public License 1.0": "Mozilla Public License 1.0",
    "Mozilla Public License 1.1": "Mozilla Public License 1.1",
    "Mozilla Public License 2.0": "Mozilla Public License 2.0",
}

const gitIgnoresOptionsObject = {
    "Actionscript": "Actionscript",
    "Ada": "Ada",
    "Agda": "Agda",
    "Android": "Android",
    "Anjuta": "Anjuta",
    "AppEngine": "AppEngine",
    "AppceleratorTitanium": "AppceleratorTitanium",
    "ArchLinuxPackages": "ArchLinuxPackages",
    "Archives": "Archives",
    "Autotools": "Autotools",
    "BricxCC": "BricxCC",
    "C": "C",
    "C Sharp": "C Sharp",
    "C++": "C++",
    "CFWheels": "CFWheels",
    "CMake": "CMake",
    "CUDA": "CUDA",
    "CVS": "CVS",
    "CakePHP": "CakePHP",
    "ChefCookbook": "ChefCookbook",
    "Cloud9": "Cloud9",
    "CodeIgniter": "CodeIgniter",
    "CodeKit": "CodeKit",
    "CommonLisp": "CommonLisp",
    "Composer": "Composer",
    "Concrete5": "Concrete5",
    "Coq": "Coq",
    "CraftCMS": "CraftCMS",
    "DM": "DM",
    "Dart": "Dart",
    "DartEditor": "DartEditor",
    "Delphi": "Delphi",
    "Dreamweaver": "Dreamweaver",
    "Drupal": "Drupal",
    "EPiServer": "EPiServer",
    "Eagle": "Eagle",
    "Eclipse": "Eclipse",
    "EiffelStudio": "EiffelStudio",
    "Elisp": "Elisp",
    "Elixir": "Elixir",
    "Emacs": "Emacs",
    "Ensime": "Ensime",
    "Erlang": "Erlang",
    "Espresso": "Espresso",
    "ExpressionEngine": "ExpressionEngine",
    "ExtJs": "ExtJs",
    "Fancy": "Fancy",
    "Finale": "Finale",
    "FlexBuilder": "FlexBuilder",
    "ForceDotCom": "ForceDotCom",
    "FuelPHP": "FuelPHP",
    "GWT": "GWT",
    "Gcov": "Gcov",
    "GitBook": "GitBook",
    "Go": "Go",
    "Gradle": "Gradle",
    "Grails": "Grails",
    "Haskell": "Haskell",
    "IGORPro": "IGORPro",
    "IPythonNotebook": "IPythonNotebook",
    "Idris": "Idris",
    "JDeveloper": "JDeveloper",
    "Java": "Java",
    "Jboss": "Jboss",
    "Jekyll": "Jekyll",
    "JetBrains": "JetBrains",
    "Joomla": "Joomla",
    "KDevelop4": "KDevelop4",
    "Kate": "Kate",
    "KiCAD": "KiCAD",
    "Kohana": "Kohana",
    "LabVIEW": "LabVIEW",
    "Laravel": "Laravel",
    "Lazarus": "Lazarus",
    "Leiningen": "Leiningen",
    "LemonStand": "LemonStand",
    "LibreOffice": "LibreOffice",
    "Lilypond": "Lilypond",
    "Linux": "Linux",
    "Lithium": "Lithium",
    "Lua": "Lua",
    "LyX": "LyX",
    "Magento": "Magento",
    "Matlab": "Matlab",
    "Maven": "Maven",
    "Mercurial": "Mercurial",
    "Mercury": "Mercury",
    "MetaProgrammingSystem": "MetaProgrammingSystem",
    "MicrosoftOffice": "MicrosoftOffice",
    "ModelSim": "ModelSim",
    "Momentics": "Momentics",
    "MonoDevelop": "MonoDevelop",
    "Nanoc": "Nanoc",
    "NetBeans": "NetBeans",
    "Nim": "Nim",
    "Ninja": "Ninja",
    "Node": "Node",
    "NotepadPP": "NotepadPP",
    "OCaml": "OCaml",
    "Objective-C": "Objective-C",
    "Opa": "Opa",
    "OpenCart": "OpenCart",
    "OracleForms": "OracleForms",
    "Packer": "Packer",
    "Perl": "Perl",
    "Phalcon": "Phalcon",
    "PhpStorm": "PhpStorm",
    "PlayFramework": "PlayFramework",
    "Plone": "Plone",
    "Prestashop": "Prestashop",
    "Processing": "Processing",
    "Python": "Python",
    "Qooxdoo": "Qooxdoo",
    "Qt": "Qt",
    "R": "R",
    "ROS": "ROS",
    "Rails": "Rails",
    "Redcar": "Redcar",
    "Redis": "Redis",
    "RhodesRhomobile": "RhodesRhomobile",
    "Ruby": "Ruby",
    "Rust": "Rust",
    "SBT": "SBT",
    "SCons": "SCons",
    "SVN": "SVN",
    "Sass": "Sass",
    "Scala": "Scala",
    "Scrivener": "Scrivener",
    "Sdcc": "Sdcc",
    "SeamGen": "SeamGen",
    "SketchUp": "SketchUp",
    "SlickEdit": "SlickEdit",
    "Stella": "Stella",
    "SublimeText": "SublimeText",
    "SugarCRM": "SugarCRM",
    "Swift": "Swift",
    "Symfony": "Symfony",
    "SymphonyCMS": "SymphonyCMS",
    "SynopsysVCS": "SynopsysVCS",
    "Tags": "Tags",
    "TeX": "TeX",
    "TextMate": "TextMate",
    "Textpattern": "Textpattern",
    "TortoiseGit": "TortoiseGit",
    "TurboGears2": "TurboGears2",
    "Typo3": "Typo3",
    "Umbraco": "Umbraco",
    "Unity": "Unity",
    "UnrealEngine": "UnrealEngine",
    "VVVV": "VVVV",
    "Vagrant": "Vagrant",
    "Vim": "Vim",
    "VirtualEnv": "VirtualEnv",
    "VisualStudio": "VisualStudio",
    "VisualStudioCode": "VisualStudioCode",
    "Waf": "Waf",
    "WebMethods": "WebMethods",
    "WebStorm": "WebStorm",
    "Windows": "Windows",
    "WordPress": "WordPress",
    "Xcode": "Xcode",
    "XilinxISE": "XilinxISE",
    "Xojo": "Xojo",
    "Yeoman": "Yeoman",
    "Yii": "Yii",
    "ZendFramework": "ZendFramework",
    "Zephir": "Zephir",
    "macOS": "macOS",
}