const Sauce = require('../models/sauce-model');
const sauceLikeRules = require('../services/like-dislike-process');
const fs = require('fs');

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
      .then((sauces) => res.status(200).json(sauces))
      .catch((error) => res.status(404).json({ error }));
  };
  
  exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
      .then(sauce => res.status(200).json(sauce))
      .catch(error => res.status(404).json({ error }));
}

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce)
  delete sauceObject._id;
  const sauce = new Sauce({
    ...sauceObject,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    likes: 0,
    dislikes: 0,
    usersLiked: [' '],
    usersdisLiked: [' '],
  });
  sauce
    .save()
    .then(() => res.status(201).json({ message: "Sauce enregistrée" }))
    .catch((error) => res.status(400).json({ error }));
};

exports.updateSauce = (req, res, next) => {
  const sauceObject = req.file ?
  {
    ...JSON.parse(req.body.sauce),
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`} : { ...req.body }

  Sauce.updateOne({ _id : req.params.id}, {...sauceObject, _id: req.params.id})
  .then(res.status(200).json({ message : "Sauce modifiée"}))
  .catch(error => res.status(400).json({ error }))
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id : req.params.id })
  .then(sauce => {
    const filename = sauce.imageUrl.split("/images/")[1]
    fs.unlink(`images/${filename}`, () => {
      Sauce.deleteOne({_id : req.params.id})
  .then(res.status(200).json({ message: "Sauce supprimée" }))
  .catch(error => res.status(400).json({ error }))
  
    })
  })
  .catch(error => res.status(500).json({ error }))
};

exports.likeAndDislikeSauce = async (req, res, next) => {
  let like = req.body.like
  let userId = req.body.userId
  let sauceId = req.params.id

  let sauce = null;
  try {
    sauce = await Sauce.findById(sauceId); //retrouver la sauce
  } catch (error){
    console.error(error)
  }

  if ( sauce === null) {
    return res.status(404).json({ message: 'Sauce inexistante'})
  }
  
  try {
  switch (like) {
    case 1 :
        //vérifier si l'utilisateur n'a pas déjà aimé la sauce
        // Sauce.updateOne({ _id: sauceId }, { $push: { usersLiked: userId }, $inc: { likes: +1 }})
        //   .then(() => res.status(200).json({ message: `J'aime` }))
        //   .catch((error) => res.status(500).json({ error }))
        await sauceLikeRules.likeSauce(userId, sauce);
        res.json({ message: `J'aime` });

    break;

    case 0 :
        // Sauce.findOne({ _id: sauceId })
        //    .then((sauce) => {
        //     if (sauce.usersLiked.includes(userId)) { 
        //       Sauce.updateOne({ _id: sauceId }, { $pull: { usersLiked: userId }, $inc: { likes: -1 }})
        //         .then(() => res.status(200).json({ message: `Neutre` }))
        //         .catch((error) => res.status(500).json({ error }))
        //     }
        //     if (sauce.usersDisliked.includes(userId)) { 
        //       Sauce.updateOne({ _id: sauceId }, { $pull: { usersDisliked: userId }, $inc: { dislikes: -1 }})
        //         .then(() => res.status(200).json({ message: `Neutre` }))
        //         .catch((error) => res.status(500).json({ error }))
        //     }
        //   })
        //   .catch((error) => res.status(404).json({ error }))
        sauceLikeRules.alreadyStatusOnSauce(userId, sauce);
        res.status(200).json({ message: `Neutre` });
      break;

    case -1 :
      //vérifier si l'utilisateur n'a pas déjà dislike la sauce
        // Sauce.updateOne({ _id: sauceId }, { $push: { usersDisliked: userId }, $inc: { dislikes: +1 }})
        //   .then(() => { res.status(200).json({ message: `Je n'aime pas` }) })
        //   .catch((error) => res.status(500).json({ error }))
        sauceLikeRules.dislikeSauce(userId, sauce);
        res.status(200).json({ message: `Je n'aime pas` });
    break;
      
      default:
        return res.status(400).json({})
  }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error })
  }
};

// créer des sous routines pour le like, dislike et neutre et faire appel à ces fonctions dans la fonction likeAndDislikeSauce
// Sauce.findById(id).then(sauce => {});