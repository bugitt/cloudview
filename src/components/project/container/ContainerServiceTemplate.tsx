import { useRequest } from 'ahooks'
import { Tabs } from 'antd'
import { ContainerServiceTemplate, Project } from '../../../cloudapi-client'
import { notificationError } from '../../../utils'
import { cloudapiClient } from '../../../utils/cloudapi'
import { CreateContainerServiceForm } from './CreateContainerServiceForm'

export const ContainerServiceTemplateGallery = (props: {
    project?: Project
}) => {
    const { data, error } = useRequest(() =>
        cloudapiClient.getContainerServiceTemplates()
    )
    notificationError(error)
    const templateList = data?.data ?? []
    const categories: { name: string; enable: boolean }[] = templateList.map(
        template => {
            return {
                name: template.categoryName,
                enable: true
            }
        }
    )
    // 为了好看，先加几个假的^_^
    categories.push({
        name: '服务器',
        enable: false
    })
    categories.push({
        name: '消息队列',
        enable: false
    })
    categories.push({
        name: '实用工具',
        enable: false
    })

    const getTemplateListByCategory = (
        category: string
    ): ContainerServiceTemplate[] => {
        const result = (
            templateList.find(it => it.categoryName === category)?.segments ??
            []
        )
            .map(it => it.templateList)
            .flat()
        return result
    }

    return (
        <div>
            <Tabs
                tabPosition="left"
                items={categories.map((category, i) => {
                    const id = String(i + 1)
                    return {
                        label: category.name,
                        key: id,
                        disabled: !category.enable,
                        children: category.enable ? (
                            <ContainerServiceTemplateCardList
                                templateList={getTemplateListByCategory(
                                    category.name
                                )}
                                project={props.project}
                            />
                        ) : null
                    }
                })}
            />
        </div>
    )
}

export const ContainerServiceTemplateCardList = (props: {
    templateList: ContainerServiceTemplate[]
    project?: Project
}) => {
    const { templateList } = props
    const cardList = templateList.map(template => {
        return <CreateContainerServiceForm template={template} />
    })
    return <>{cardList}</>
}
