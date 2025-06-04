import { type NextRequest, NextResponse } from "next/server"
import { Client } from "@notionhq/client"

export async function GET(request: NextRequest) {
  try {
    const notionToken = request.headers.get("x-notion-token")
    const notionDbId = request.headers.get("x-notion-db-id")

    if (!notionToken || !notionDbId) {
      return NextResponse.json({ error: "Notion credentials not provided" }, { status: 400 })
    }

    const notion = new Client({ auth: notionToken })

    // Fetch database to get property names and available categories
    const database = await notion.databases.retrieve({
      database_id: notionDbId,
    })

    // Extract property names and category options
    const propertyNames = Object.entries(database.properties).reduce(
      (acc, [key, value]) => {
        acc[value.type] = key
        return acc
      },
      {} as Record<string, string>,
    )

    // Get select options for category property if it exists
    let categoryOptions: { id: string; name: string; color: string }[] = []
    const categoryProperty = Object.values(database.properties).find(
      (prop) => prop.type === "select" && prop.name.toLowerCase().includes("category"),
    )

    if (categoryProperty?.type === "select" && categoryProperty.select.options) {
      categoryOptions = categoryProperty.select.options
    }

    // Filter to only include the requested categories
    const requestedCategories = ["Idea", "Task", "Reminder", "Shopping List", "Calculation"]
    const filteredCategories = categoryOptions.filter((option) =>
      requestedCategories.some((cat) => option.name.toLowerCase().includes(cat.toLowerCase())),
    )

    return NextResponse.json({
      propertyNames,
      categories: filteredCategories,
    })
  } catch (error: any) {
    console.error("Error fetching Notion database:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch Notion database",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, category, mode, timestamp } = await request.json()

    // Get Notion credentials from headers
    const notionToken = request.headers.get("x-notion-token")
    const notionDbId = request.headers.get("x-notion-db-id")

    if (!notionToken || !notionDbId) {
      return NextResponse.json({ error: "Notion credentials not provided" }, { status: 400 })
    }

    const notion = new Client({ auth: notionToken })

    // First, retrieve the database to get the actual property names
    const database = await notion.databases.retrieve({
      database_id: notionDbId,
    })

    // Find the correct property names based on their types
    let titleProperty = ""
    let contentProperty = ""
    let categoryProperty = ""
    let typeProperty = ""
    let dateProperty = ""

    for (const [propName, propDetails] of Object.entries(database.properties)) {
      if (propDetails.type === "title") {
        titleProperty = propName
      } else if (propDetails.type === "rich_text" && propName.toLowerCase().includes("text")) {
        contentProperty = propName
      } else if (propDetails.type === "select" && propName.toLowerCase().includes("category")) {
        categoryProperty = propName
      } else if (propDetails.type === "select" && propName.toLowerCase().includes("type")) {
        typeProperty = propName
      } else if (
        propDetails.type === "date" &&
        (propName.toLowerCase().includes("time") || propName.toLowerCase().includes("date"))
      ) {
        dateProperty = propName
      }
    }

    if (!titleProperty) {
      return NextResponse.json({ error: "Title property not found in Notion database" }, { status: 400 })
    }

    // Create a meaningful title from the transcription content
    const createTitle = (transcriptionText: string, mode: string) => {
      // Clean the text and get first meaningful words
      const cleanText = transcriptionText.trim().replace(/\s+/g, " ")

      // Get first 50 characters or first sentence, whichever is shorter
      let title = cleanText.length > 50 ? cleanText.substring(0, 50) + "..." : cleanText

      // If it's a calculation, try to extract the math expression
      if (mode === "calculate") {
        // Look for mathematical expressions or numbers
        const mathMatch = cleanText.match(/[\d+\-*/=\s]+/)
        if (mathMatch) {
          title = mathMatch[0].trim()
          if (title.length > 30) {
            title = title.substring(0, 30) + "..."
          }
        }
      }

      // Fallback to first few words if title is too short or just punctuation
      if (title.length < 5 || /^[^\w]*$/.test(title)) {
        const words = cleanText.split(" ").filter((word) => word.length > 0)
        title = words.slice(0, 5).join(" ")
        if (words.length > 5) title += "..."
      }

      return title || `${mode === "calculate" ? "Calculation" : "Note"} - ${new Date().toLocaleDateString()}`
    }

    // Prepare properties object with the correct property names
    const properties: any = {
      [titleProperty]: {
        title: [
          {
            text: {
              content: createTitle(text, mode),
            },
          },
        ],
      },
    }

    // Add the full transcription content to the Text/Content property
    if (contentProperty) {
      properties[contentProperty] = {
        rich_text: [
          {
            text: {
              content: text,
            },
          },
        ],
      }
    } else {
      // If no dedicated content property, put the full text in the title
      properties[titleProperty] = {
        title: [
          {
            text: {
              content: text.length > 100 ? text.substring(0, 100) + "..." : text,
            },
          },
        ],
      }
    }

    // Add category property if found
    if (categoryProperty && category) {
      properties[categoryProperty] = {
        select: {
          name: category,
        },
      }
    }

    // Add type property if found
    if (typeProperty) {
      properties[typeProperty] = {
        select: {
          name: mode === "calculate" ? "Calculation" : "Text",
        },
      }
    }

    // Add date property if found
    if (dateProperty) {
      properties[dateProperty] = {
        date: {
          start: timestamp,
        },
      }
    }

    console.log("Creating Notion page with properties:", {
      titleProperty,
      contentProperty,
      categoryProperty,
      typeProperty,
      dateProperty,
      textLength: text.length,
      category,
      mode,
    })

    // Create page in Notion database
    const response = await notion.pages.create({
      parent: {
        database_id: notionDbId,
      },
      properties,
    })

    return NextResponse.json({
      success: true,
      pageId: response.id,
      title: createTitle(text, mode),
      savedProperties: Object.keys(properties),
    })
  } catch (error: any) {
    console.error("Notion API error:", error)
    return NextResponse.json(
      {
        error: "Failed to add to Notion",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
