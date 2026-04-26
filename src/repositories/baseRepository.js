class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findAll(filter = {}, options = {}) {
    const { page = 1, limit = 20, sort = '-createdAt', populate = '', select = '' } = options;
    const skip = (page - 1) * limit;

    let query = this.model.find(filter).sort(sort).skip(skip).limit(Number(limit));

    if (populate) query = query.populate(populate);
    if (select) query = query.select(select);

    const [data, total] = await Promise.all([query.exec(), this.model.countDocuments(filter)]);

    return {
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async findById(id, populate = '') {
    let query = this.model.findById(id);
    if (populate) query = query.populate(populate);
    return query.exec();
  }

  async findOne(filter, populate = '') {
    let query = this.model.findOne(filter);
    if (populate) query = query.populate(populate);
    return query.exec();
  }

  async create(data) {
    return this.model.create(data);
  }

  async update(id, data, options = { new: true, runValidators: true }) {
    return this.model.findByIdAndUpdate(id, data, options);
  }

  async delete(id) {
    return this.model.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  async aggregate(pipeline) {
    return this.model.aggregate(pipeline);
  }

  async bulkCreate(data) {
    return this.model.insertMany(data);
  }

  async updateMany(filter, data) {
    return this.model.updateMany(filter, data, { runValidators: true });
  }
}

module.exports = BaseRepository;
