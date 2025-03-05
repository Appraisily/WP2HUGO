# KWRDS.AI API Documentation - Keyword Research Endpoint

## Endpoint
**POST /keywords-with-volumes**

This endpoint retrieves detailed keyword metrics including search volume, CPC, search intent, and competition level.

## Example Request
Here's an example of how to use the Keyword Research API with cURL:

```bash
curl --location 'https://keywordresearch.api.kwrds.ai/keywords-with-volumes' \
--header 'X-API-KEY: YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data '{
    "search_question": "facet",
    "search_country": "en-US"
}'
```

## Request Body
- **search_question**: (Required) The keyword or phrase for which you want to retrieve metrics. This should be a string.
- **search_country**: (Required) The country code (e.g., en-US) for which the search should be localized. The first part is the ISO 639-1 language code, and the second part is the ISO 3166-1 alpha-2 country code. Pass en-worldwide to get the global search volume. Default is en-US.
- **limit**: (Optional) The maximum number of keywords to return. Default is undefined, which returns all keywords.

## Headers
- **X-API-KEY**: (Required) Your API key for authentication.
- **Content-Type**: (Required) The content type of the request, which should be application/json.

## Example Response
The API returns a JSON object containing detailed metrics for the specified keyword. Here's an example response:

```json
{
    "keyword": {
        "0": "test",
        "1": "example"
    },
    "volume": {
        "0": 201000,
        "1": 50000
    },
    "cpc": {
        "0": 0.0,
        "1": 1.9035980231
    },
    "avg_monthly_searches": { 
        "0": [
            {
                "January": 20000,
                "February": 18000,
                "March": 22000
            },
            {
                "January": 12000,
                "February": 15000,
                "March": 13000
            }
        ]
    },
    "search-intent": {
        "0": "General",
        "1": "Informational"
    },
    "competition_value": {
        "0": "LOW",
        "1": "MEDIUM"
    }
}
```

## Response Structure
- **keyword**: An object where each key represents an index and the value is the keyword string.
- **volume**: An object where each key represents an index and the value is the search volume for the corresponding keyword.
- **cpc**: An object where each key represents an index and the value is the cost-per-click (CPC) for the corresponding keyword.
- **avg_monthly_searches**: An object where each key represents an index and the value is a stringified JSON object containing the average monthly search volume for each month.
- **search-intent**: An object where each key represents an index and the value is the search intent for the corresponding keyword (e.g., "General", "Informational").
- **competition_value**: An object where each key represents an index and the value is the competition level for the corresponding keyword. Possible values are "LOW", "MEDIUM", and "HIGH".

💡 **Tip**: In a case of a Google downtime, we will use different vendors to get your data from. In such rare cases, The avg_monthly_searches and competition_value might be undefined, hence you will want to make sure to accommodate for this in your application. 