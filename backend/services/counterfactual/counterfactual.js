const {hasAccess} = require("../../helpers/hasAccess");
const {Transaction} = require("graphdb-utils");
const {counterfactualBuilder} = require("./counterfactualBuilder");


const RESOURCE = 'Counterfactual'

const createCounterfactualHandler = async (req, res, next) => {
  try {
    if (await hasAccess(req, 'create' + RESOURCE)){
      const {form} = req.body;
      await Transaction.beginTransaction();
      form.iso72Value = form.value
      if(await counterfactualBuilder('interface', null,
        null, null, {}, {}, form)) {
        await Transaction.commit();
        return res.status(200).json({success: true})
      }
    }
    return res.status(400).json({message: 'Wrong Auth'});
  } catch (e) {
    if (Transaction.isActive())
      Transaction.rollback();
    next(e);
  }
};

module.exports = {createCounterfactualHandler}