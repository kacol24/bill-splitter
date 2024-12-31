import Alpine from 'alpinejs';
import sum from 'lodash/sum';
import sumBy from 'lodash/sumBy';
import map from 'lodash/map';

export default () => ({
  init() {
    this.calculateSum();
  },

  // participants
  participants: Alpine.$persist([]),
  selectedParticipantIndex: null,
  get selectedParticipant() {
    return this.participants[this.selectedParticipantIndex];
  },
  getParticipantIndex(item) {
    return item.participants.findIndex(
        participant => participant.id === this.selectedParticipant.id);
  },
  getParticipantCsv(participant) {
    let push = participant.name;
    if (participant.qty > 1) {
      push = push + ` (${participant.qty})`;
    }

    return push;
  },
  calculateSum() {
    this.participants.forEach(participant => {
      participant.sum = 0;
      participant.items = [];
      participant.breakdown = [];
    });
    this.items.forEach(item => {
      const divider = sum(map(item.participants, 'qty'));
      const price = parseInt(item.price.toString().replaceAll(',', ''));
      const pricePerQty = price / divider;
      item.participants.forEach(itemParticipant => {
        const participantIndex = this.participants.findIndex(
            participant => {
              return participant.id === itemParticipant.id;
            }
        );
        const pricePerParticipant = pricePerQty * itemParticipant.qty;
        this.participants[participantIndex].items.push({
          'name': item.name,
          'price': pricePerParticipant,
          'split': `${itemParticipant.qty}/${divider}`
        });
        this.participants[participantIndex].sum += pricePerParticipant;
      });
    });
    this.participants.forEach(participant => {
      participant.breakdown.push({
        'key': 'Subtotal',
        'value': participant.sum
      });
      this.charges.forEach(charge => {
        let extra = participant.sum * charge.percent;
        participant.breakdown.push({
          'key': `${charge.name} (${Math.round(charge.percent * 1000) /
          10}%)`,
          'value': extra
        });
        participant.sum += extra;
      });
      participant.sum = Math.ceil(participant.sum);
    });
  },
  get sum() {
    return sumBy(this.participants, participant => participant.sum);
  },

  // items
  items: Alpine.$persist([
    {
      price: 0,
      participants: []
    }
  ]),
  get subtotal() {
    return sumBy(this.items,
        item => parseInt(item.price.toString().replaceAll(',', '')));
  },
  get grandtotal() {
    let charges = sumBy(this.charges,
        charge => parseInt(charge.price.toString().replaceAll(',', '')));

    return this.subtotal + charges;
  },

  // charges
  charges: Alpine.$persist([
    {
      name: '',
      price: 0,
      percent: 0
    }
  ]),
  calculateTaxPercent() {
    this.calculateSum();
    let subtotal = this.subtotal;
    this.charges.forEach((charge) => {
      let price = parseInt(charge.price.toString().replaceAll(',', ''));
      charge.percent = price / subtotal;
      subtotal += price;
    });
  },
  setModal(index) {
    this.selectedParticipantIndex = index;
  },
  addQty(index) {
    if (this.selectedParticipantIndex == null) {
      throw new Error('Harus pilih anggota.');
    }

    let selectedParticipant = this.participants[this.selectedParticipantIndex];
    let participantIndex = this.items[index].participants.findIndex(
        itemParticipant => {
          return itemParticipant.id === selectedParticipant.id;
        }
    );
    if (participantIndex < 0) {
      this.items[index].participants.push({
        id: selectedParticipant.id,
        name: selectedParticipant.name,
        qty: 1
      });
    } else {
      this.items[index].participants[participantIndex].qty++;
    }
    Alpine.$dispatch('qty-changed');
  },
  subQty(index) {
    if (this.selectedParticipantIndex == null) {
      throw new Error('Harus pilih anggota.');
    }

    let selectedParticipant = this.participants[this.selectedParticipantIndex];
    let participantIndex = this.items[index].participants.findIndex(
        itemParticipant => {
          return itemParticipant.id === selectedParticipant.id;
        }
    );
    if (participantIndex < 0) {
      return;
    }

    if (this.items[index].participants[participantIndex].qty <= 0) {
      return;
    }

    this.items[index].participants[participantIndex].qty--;

    if (this.items[index].participants[participantIndex].qty <= 0) {
      this.items[index].participants.splice(participantIndex, 1);
    }

    Alpine.$dispatch('qty-changed');
  }
});
