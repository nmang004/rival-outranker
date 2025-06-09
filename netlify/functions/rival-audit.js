// netlify/functions/rival-audit.ts
var auditCache = {};
function generateMockRivalAudit(url) {
  return {
    id: Math.floor(Math.random() * 1e3) + 1,
    url,
    status: "completed",
    startTime: /* @__PURE__ */ new Date(),
    endTime: /* @__PURE__ */ new Date(),
    summary: {
      priorityOfiCount: 3,
      ofiCount: 12,
      okCount: 25,
      naCount: 5,
      total: 45
    },
    onPage: {
      items: [
        {
          name: "Page Title Optimization",
          status: "OFI",
          description: "Page titles could be more descriptive",
          notes: "Consider adding location-based keywords"
        },
        {
          name: "Meta Description Optimization",
          status: "Priority OFI",
          description: "Meta descriptions are missing or too short",
          notes: "Add compelling meta descriptions to improve click-through rates"
        },
        {
          name: "Header Tags Structure",
          status: "OK",
          description: "Good use of H1 and H2 tags",
          notes: "Proper heading hierarchy implemented"
        }
      ]
    },
    structureNavigation: {
      items: [
        {
          name: "Main Navigation Menu",
          status: "OK",
          description: "Clear navigation structure",
          notes: "Easy to find important pages"
        },
        {
          name: "Breadcrumb Navigation",
          status: "OFI",
          description: "Missing breadcrumb navigation",
          notes: "Consider adding breadcrumbs for better user experience"
        }
      ]
    },
    contactPage: {
      items: [
        {
          name: "Contact Information Visibility",
          status: "OK",
          description: "Contact information is easily accessible",
          notes: "Phone number and address clearly displayed"
        },
        {
          name: "Contact Form Functionality",
          status: "OFI",
          description: "Contact form could be improved",
          notes: "Consider adding more specific form fields"
        }
      ]
    },
    servicePages: {
      items: [
        {
          name: "Has a single Service Page for each primary service?",
          status: "OK",
          description: "Dedicated service pages found",
          notes: "Individual pages for each service offering"
        },
        {
          name: "Service Page SEO Optimization",
          status: "Priority OFI",
          description: "Service pages need SEO optimization",
          notes: "Optimize titles and content for target keywords"
        }
      ]
    },
    locationPages: {
      items: [
        {
          name: "Location-Specific Pages",
          status: "N/A",
          description: "No location-specific pages found",
          notes: "Consider creating pages for service areas"
        }
      ]
    }
  };
}
var handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
      },
      body: ""
    };
  }
  try {
    if (event.httpMethod === "POST") {
      let body = {};
      if (event.body) {
        body = JSON.parse(event.body);
      }
      const { url, continueCrawl } = body;
      if (!url) {
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
          body: JSON.stringify({ error: "URL is required" })
        };
      }
      const auditId = Math.floor(Math.random() * 1e3) + 1;
      const auditResults = generateMockRivalAudit(url);
      auditResults.id = auditId;
      auditCache[auditId] = auditResults;
      console.log(`Generated mock rival audit for ${url} with ID ${auditId}`);
      return {
        statusCode: 202,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          id: auditId,
          message: continueCrawl ? "Continuing audit" : "Audit started",
          url
        })
      };
    }
    if (event.httpMethod === "GET") {
      const idParam = event.queryStringParameters?.id;
      if (!idParam) {
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
          body: JSON.stringify({ error: "Audit ID is required" })
        };
      }
      const auditId = parseInt(idParam);
      if (isNaN(auditId)) {
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
          body: JSON.stringify({ error: "Invalid audit ID" })
        };
      }
      if (!auditCache[auditId]) {
        return {
          statusCode: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
          body: JSON.stringify({ error: "Audit not found or still processing" })
        };
      }
      const audit = auditCache[auditId];
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify(audit)
      };
    }
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ message: "Method not allowed" })
    };
  } catch (error) {
    console.error("Rival audit error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        message: "Rival audit failed",
        error: error instanceof Error ? error.message : "Unknown error"
      })
    };
  }
};
export {
  handler
};
