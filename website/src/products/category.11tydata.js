export default {
  eleventyComputed: {
    breadcrumbs: (data) => [
      { label: "Products", url: "/products/" },
      { label: data.cat.name },
    ],
  },
};
