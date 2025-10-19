# Pennylane frontend challenge

This repository contains the guidelines for the frontend interview question, as well as a repository skeleton with which to start.

## Your mission

> ***Implement an invoice editor with React***

### Objectives

The goal is to leverage an existing REST HTTP API to build the prototype of an invoicing editor.

This prototype allows users to perform simple actions around their invoices:

- List existing invoices with relevant details
- Create new invoices
- Manage existing invoices
  - Finalize invoices
  - Delete invoices
 
We do not expect the prototype to be UI-rich as we'll mainly focus on code quality & user experience. We expect you to adopt standard coding practices & setup, including testing, as if you were working on a real application with other coworkers.

Feel free to use pre-installed dependencies or add new ones if you have a legitimate use of them.

Please take the time to identify advanced features that could be useful for an invoice editor & write down tech improvements/ideas you could work on.

For each feature/tech improvement, we want to understand:

- What led you to think about this
- Why it would be useful
- A potential prototype implementation (feel free to work around API limitations)
- What might be missing for you to implement it (API limitations, technical constraints)

### Deliverable

- The codebase should be pushed on the current GitHub private repository;
- Deploy the application using any PaaS like Vercel, Netlify, Heroku, Cloudflare Pages, personal server, etc;
- Submit links to the above [via this form](https://forms.gle/siH7Rezuq2V1mUJGA).

## What you're working with

### Data model

The REST API contains 4 resources: customers, products, invoices & invoice lines.

Side notes:

- Invoices contain multiple invoice lines.
- Invoice lines are accessed via their invoice. To update them, use the relevant invoice API endpoints.
- Once the `finalized` field is set to `true` for invoices, no field may be modified except for `paid`.

The REST API base URL is `https://jean-test-api.herokuapp.com/`.
Each API request must include an HTTP header named `X-SESSION`. The value of this header should be the token provided in the current repository description.

An OpenAPI definition for this REST API is available [here](https://jean-test-api.herokuapp.com/api-docs/index.html).

The invoices list endpoint supports a `filter` query param which can be used as described in [our external API documentation](https://pennylane.readme.io/docs/setting-up-filters).

### API client

An API client based on `openapi-client-axios` is available through a React Context set up in `src/app/index.tsx`. The context can be consumed using the `useApi` hook. Before using it, please add the token you received in `/src/app/index.tsx`. If you do not have one, please contact us.

```tsx
ReactDOM.render(
  <ApiProvider
    url="https://jean-test-api.herokuapp.com/"
    token="" // set your api token here, you can find the required token in the repository description.
  >
    <App />
  </ApiProvider>
);
```

```tsx
import { useEffect } from "react";
import { useApi } from "api";

const FooComponent = () => {
  const api = useApi();

  useEffect(() => {
    const fetch = async () => {
      const res = await api.getInvoices();
    }

    fetch();
  })

  return <div>bar</div>;
}
```

### Repository contents

This repository has been initialized with [create-react-app](https://github.com/facebook/create-react-app). It is to be used as a starting point for developing the prototype.

A set of packages has been included in [package.json](./package.json), please feel free to use them. Their usage is optional; you are not expected to learn any new libraries for this test.

As much as possible, please avoid introducing new dependencies - if you find this necessary, please explain why.

You'll find the `InvoicesList` component already started in the `components` folder.

If you prefer to use JavaScript without typing, you can execute the command `yarn eject_ts`

### Deployment of the app

As mentioned above, as a deliverable of the project, we expect you to deploy your application. Unfortunately, due to GitHub permissions, depending on the PaaS you choose, you might lack the appropriate permissions to install the necessary GitHub actions to do this automatically.

Therefore, we suggest you use the associated CLI of the PaaS or their drag-and-drop UI widget to easily deploy.

One potential free solution to deploy the app is to use Cloudflare Pages.

Prerequisite:
- **Have a personal Cloudflare account (this is free)**. If you don't have one, [you can easily sign up on the Cloudflare website.](https://dash.cloudflare.com/sign-up/workers-and-pages)

Steps to deploy the app:
1. **Run `yarn build`**: This command will compile your application.

2. **Install Wrangler (Cloudflare CLI) globally via npm using `npm install -g wrangler`**: Wrangler is a command-line tool that allows you to interact with Cloudflare services. 

2. **Run `wrangler pages project create <my-react-app>` (replace <my-react-app> with the name of your app)**: This command creates a new project on Cloudflare Pages. It will open an OAuth page to authorize Cloudflare with your GitHub account. At the end, it will provide you with a stable link to access your app.

3. **Run `wrangler pages deploy build`**: This command triggers a new deployment of your app. You need to run it every time you want to deploy changes to your app.

4. **Run `wrangler pages project list`** if you don't remember the URL of your app: This will list all your Cloudflare projects and their corresponding URLs.