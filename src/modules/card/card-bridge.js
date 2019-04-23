import CardContainer from './container/container-concreter';
import PopupContainer from './../popup/container/container-concreter';

import buildMain from './main/main-builder';
import buildInfo from './../popup/info/info-builder';
import buildComment from './../popup/comment/comment-builder';
import buildRating from './../popup/rating/rating-builder.js';

import {Key} from '../../data';

import {manufacture} from '../../assets/factory';
import {
  blockComment,
  unblockComment,
  blockRating,
  unblockRating,
  load, blockUndo, unblockUndo
} from '../../assets/util/';

const body = document.querySelector(`body`);
const cardsContainer = body.querySelector(
    `.films-list__container--main`);

export default (cards, Api) => {
  cardsContainer.innerHTML = ``;

  const renderCards = (updatedCards = null) => {
    const activeCards = updatedCards || cards;

    for (let i = 0; i < activeCards.length; i++) {
      const card = activeCards[i];

      let main;
      let producedPopupBuilders = [];

      const {
        comments, title, image,
        isFavorite, isWatched, willWatch} = card;

      const cardContainer = new CardContainer(comments);
      const popupContainer = new PopupContainer(
        {image, title, isFavorite, isWatched, willWatch});

      const formSubmit = (evt) => {
        if (evt.ctrlKey === true && evt.keyCode === Key.ENTER) {

          popupContainer.onSubmit = (newData) => {

            blockComment(popupContainer, `.film-details__comment-input`);
            card.comments.push(newData.comment);

            Api.updateCard({id: card.id, data: card.toRAW()})
              .then((newCard) => load(newCard))

              .then((newCard) => {
                const comment = producedPopupBuilders.find((it) => it[`comment`]);

                unblockComment(popupContainer,
                  `.film-details__comment-input`, true);

                cardContainer.update(newCard);
                comment[`comment`].update(newCard);
                popupContainer.update(newCard);
                popupContainer.enable();

              })
              .catch(() => {

                popupContainer.shake();
                unblockComment(popupContainer,
                  `.film-details__comment-input`, false);
              });
          };
        }
      };

      const popupHide = (evt) => {
        const key = evt.keyCode;
        if (key === Key.ESCAPE) {

          popupContainer.onClose = (keyCode) => {

            cardContainer.bind();

            body.removeEventListener(`keydown`, formSubmit);
            body.removeEventListener(`keydown`, popupHide);
            body.removeChild(popupContainer.element);
            popupContainer.unrender();
          };
        }
      };

      const popupBuilders = [
        buildInfo, buildComment, buildRating
      ];

      cardsContainer.appendChild(cardContainer.render());
      main = buildMain(card, cardContainer.element);

      cardContainer.onComments = () => {
        popupContainer.render();

        producedPopupBuilders = manufacture(
          card, popupContainer.element, ...popupBuilders);

        popupContainer.updateState();

        body.appendChild(popupContainer.element);
        body.addEventListener('keydown', formSubmit);
        body.addEventListener(`keydown`, popupHide);

        cardContainer.unbind();
      };

      popupContainer.onRating = (data) => {

        blockRating(popupContainer, `.film-details__user-rating-score`);
        card.rating = data.rating;

        Api.updateCard({id: card.id, data: card.toRAW()})
          .then((newCard) => load(newCard))

          .then((newCard) => {
            const rating = producedPopupBuilders.find((it) => it[`rating`]);

            unblockRating(popupContainer,
              `.film-details__user-rating-score`, true);

            rating[`rating`].update(newCard);
          })
          .catch(() => {

            popupContainer.shake();
            unblockRating(popupContainer,
              `.film-details__user-rating-score`, false);
          });
      };

      popupContainer.onControls = (target) => {

        card.isWatched = target.isWatched;
        card.willWatch = target.willWatch;
        card.isFavorite = target.isFavorite;

        popupContainer.update(card);
      };

      popupContainer.onUndo = (target) => {

        blockUndo(popupContainer, target);
        card.comments.pop();

        Api.updateCard({id: card.id, data: card.toRAW()})
          .then((newCard) => load(newCard))

          .then((newCard) => {
            const comment = producedPopupBuilders.find((it) => it[`comment`]);

            unblockUndo(popupContainer,
              target, true);

            cardContainer.update(newCard);
            comment[`comment`].update(newCard);
            popupContainer.update(newCard);
            popupContainer.disable();

          })
          .catch(() => {

            popupContainer.shake();
            unblockUndo(popupContainer,
              target, false);
          });
      };

      popupContainer.onClose = () => {
        cardContainer.bind();

        body.removeEventListener(`keydown`, formSubmit);
        body.removeEventListener(`keydown`, popupHide);
        body.removeChild(popupContainer.element);
        popupContainer.unrender();
      };
    }
  };
  renderCards();
};
