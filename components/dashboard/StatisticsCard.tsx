import { Badge, Card } from '../ui'
import { RiArchiveFill, RiBuilding3Fill, RiClipboardFill, RiCoupon2Fill, RiPriceTag3Fill, RiWalletFill } from 'react-icons/ri'

type Props = {}

const StatisticsCard = (props: Props) => {
  return (
    <div className='grid grid-cols-2 md:grid-cols-6 gap-4 my-5'>
      <Card className='shadow-none!'>
        <div className="flex items-center justify-between">
          <RiBuilding3Fill size={24} className='text-(--primary)' />
          <Badge className='py-0.5!' variant='success'>
            +4
          </Badge>
        </div>
        <h2 className="mt-5 text-sm md:text-md text-(--muted)">SUPPLIERS</h2>
        <h3 className="mt-2 text-xl md:text-3xl font-bold">
          453
        </h3>
      </Card>
      <Card className='shadow-none!'>
        <div className="flex items-center justify-between">
          <RiArchiveFill size={24} className='text-(--primary)' />
          <Badge className='py-0.5!' variant='success'>
            +12%
          </Badge>
        </div>
        <h2 className="mt-5 text-sm md:text-md text-(--muted)">ACTIVE PRODS</h2>
        <h3 className="mt-2 text-xl md:text-3xl font-bold">
          12,540
        </h3>
      </Card>
      <Card className='shadow-none!'>
        <div className="flex items-center justify-between">
          <RiPriceTag3Fill size={24} className='text-orange-400' />
          <Badge className='py-0.5!' variant='warning'>
            8 New
          </Badge>
        </div>
        <h2 className="mt-5 text-sm md:text-md text-(--muted)">BULK DEALS</h2>
        <h3 className="mt-2 text-xl md:text-3xl font-bold">
          84
        </h3>
      </Card>
      <Card className='shadow-none!'>
        <div className="flex items-center justify-between">
          <RiClipboardFill size={24} className='text-(--primary)/70' />
          <Badge className='py-0.5!' variant='primary'>
            In Transit
          </Badge>
        </div>
        <h2 className="mt-5 text-sm md:text-md text-(--muted)">ORDERS PROCESSED</h2>
        <h3 className="mt-2 text-xl md:text-3xl font-bold">
          453
        </h3>
      </Card>
      <Card className='shadow-none!'>
        <div className="flex items-center justify-between">
          <RiWalletFill size={24} className='text-green-400' />
          <Badge className='py-0.5!' variant='success'>
            +8.2%
          </Badge>
        </div>
        <h2 className="mt-5 text-sm md:text-md text-(--muted)">REVENUE</h2>
        <h3 className="mt-2 text-xl md:text-3xl font-bold">
          $1.2M
        </h3>
      </Card>
      <Card className='shadow-none!'>
        <div className="flex items-center justify-between">
          <RiCoupon2Fill size={24} className='text-red-500' />
          <Badge className='py-0.5!' variant='danger'>
            High Priority
          </Badge>
        </div>
        <h2 className="mt-5 text-sm md:text-md text-(--muted)">TICKETS</h2>
        <h3 className="mt-2 text-xl md:text-3xl font-bold">
          18
        </h3>
      </Card>
    </div>
  )
}

export default StatisticsCard