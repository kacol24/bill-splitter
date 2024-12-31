import Alpine from 'alpinejs';
import mask from '@alpinejs/mask';
import persist from '@alpinejs/persist';
import billSplitter from './components/billSplitter';
import participantList from './components/participantList';
import itemList from './components/itemList';
import chargesList from './components/chargesList';

Alpine.plugin(persist);
Alpine.plugin(mask);

Alpine.data('BillSplitter', billSplitter);
Alpine.data('ParticipantList', participantList);
Alpine.data('ItemList', itemList);
Alpine.data('ChargesList', chargesList);

window.Alpine = Alpine;
Alpine.start();
