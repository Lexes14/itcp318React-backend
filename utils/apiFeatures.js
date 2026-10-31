class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  search() {
    const keyword = this.queryString.keyword
      ? {
          $or: [
            { name: { $regex: this.queryString.keyword, $options: "i" } },
            { brand: { $regex: this.queryString.keyword, $options: "i" } },
            { sku: { $regex: this.queryString.keyword, $options: "i" } },
          ],
        }
      : {};
    this.query = this.query.find(keyword);
    return this;
  }
  filter() {
    const queryCopy = { ...this.queryString };
    ["keyword", "page", "limit"].forEach((key) => delete queryCopy[key]);
    const filter = {};
    Object.entries(queryCopy).forEach(([field, value]) => {
      const bracketMatch = field.match(/^(.+)\[(gte|gt|lte|lt)\]$/);
      if (bracketMatch) {
        const [, cleanField, operator] = bracketMatch;
        const path = cleanField.includes("[")
          ? cleanField.replace(/\[([^\]]+)\]/g, ".$1")
          : cleanField;
        filter[path] = { [`$${operator}`]: Number(value) };
        return;
      }
      const nestedMatch = field.match(/^(.+)\[([^\]]+)\]$/);
      if (nestedMatch) {
        filter[`${nestedMatch[1]}.${nestedMatch[2]}`] = value;
        return;
      }
      const colonMatch =
        typeof value === "string" && value.match(/^(gte|gt|lte|lt):(.+)$/);
      if (colonMatch) {
        filter[field === "rating" ? "ratings" : field] = {
          [`$${colonMatch[1]}`]: Number(colonMatch[2]),
        };
        return;
      }
      if (value && typeof value === "object" && !Array.isArray(value)) {
        filter[field] = {};
        Object.entries(value).forEach(([operator, operatorValue]) => {
          filter[field][`$${operator}`] = Number(operatorValue);
        });
      } else filter[field] = value;
    });
    this.query = this.query.find(filter);
    return this;
  }
  pagination(resPerPage) {
    const page = Number(this.queryString.page) || 1;
    this.query = this.query.limit(resPerPage).skip(resPerPage * (page - 1));
    return this;
  }
}
module.exports = APIFeatures;
