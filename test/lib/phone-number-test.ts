import {expect} from 'chai';
import {parsePhoneNumber} from '../../lib/phone-number';

describe('parsePhoneNumber()', () => {
  it('should handle empty string', () => {
    expect(parsePhoneNumber('')).to.be.eql(null);
  });
  it('should handle phone number in different format', () => {
    expect(parsePhoneNumber('88005553535')).to.be.eql('88005553535');
    expect(parsePhoneNumber('+78005553535')).to.be.eql('88005553535');
    expect(parsePhoneNumber('+7 800 555 3535')).to.be.eql('88005553535');
    expect(parsePhoneNumber('+7 (800) 555-35.35')).to.be.eql('88005553535');
  });
  it('should handle phone number in text', () => {
    expect(parsePhoneNumber('some 88005553535 text')).to.be.eql('88005553535');
    expect(parsePhoneNumber('some +78005553535 text')).to.be.eql('88005553535');
    expect(parsePhoneNumber('some +7 800 555 3535 text')).to.be.eql('88005553535');
    expect(parsePhoneNumber('some +7 (800) 555-35.35 text')).to.be.eql('88005553535');
  });
  it('should handle multiple phone numbers in text', () => {
    expect(parsePhoneNumber('some 88005553535 text 88005553536 again')).to.be.eql('88005553535');
    expect(parsePhoneNumber('some +78005553535 text +78005553536 again')).to.be.eql('88005553535');
    expect(parsePhoneNumber('some +7 800 555 3535 text +7 800 555 3536 again')).to.be.eql('88005553535');
    expect(
      parsePhoneNumber('some +7 (800) 555-35.35 text +7 (800) 555-35.36 again')
    ).to.be.eql('88005553535');
  });
  it('should fail on mixed string', () => {
    expect(parsePhoneNumber('8800 text 5553535')).to.be.eql(null);
    expect(parsePhoneNumber('+7800555 text 3535')).to.be.eql(null);
    expect(parsePhoneNumber('+7 800 555 text3535')).to.be.eql(null);
    expect(parsePhoneNumber('+7 (800text) 555-35.35')).to.be.eql(null);
  });
});
